const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { Octokit } = require("@octokit/rest");
const GitHubService = require('../server/services/githubService');
const AIService = require('../server/services/aiService');

const app = express();
app.use(cors());
// Limit request body to 200kb — prevents sending huge payloads
app.use(express.json({ limit: '200kb' }));

// Rate limiters (in-memory — effective on warm serverless instances)
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute window
  max: 30,               // 30 chat messages per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'יותר מדי בקשות. נסה שוב בעוד דקה.' }
});

const executeLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute window
  max: 10,              // 10 executions per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'יותר מדי ביצועים. נסה שוב בעוד דקה.' }
});

const getServices = (req) => {
  const aiKey = req.headers['x-ai-key'];
  const githubToken = req.headers['x-github-token'];
  return {
    github: new GitHubService(githubToken),
    ai: new AIService('google', aiKey)
  };
};

// Flatten the old nested structure format { root: {...}, api: {...} } into { "path": "description" }
function flattenOldStructure(node, prefix = '') {
  const result = {};
  for (const [key, value] of Object.entries(node)) {
    if (typeof value === 'string') {
      const filePath = prefix ? `${prefix}/${key}` : key;
      result[filePath] = value;
    } else if (value && typeof value === 'object') {
      const subPrefix = key === 'root' ? '' : (prefix ? `${prefix}/${key}` : key);
      Object.assign(result, flattenOldStructure(value, subPrefix));
    }
  }
  return result;
}

// Compress history before sending to AI:
// - Strips executed plan blocks [[[...]]] to avoid confusing the model
// - Truncates long messages (code dumps, etc.) to cap token usage
// - Keeps last 8 messages
function compressHistory(history) {
  return (history || [])
    .slice(-8)
    .map(msg => {
      let text = (msg.text || '').replace(/\[\[\[[\s\S]*?\]\]\]/g, '[תוכנית בוצעה]');
      if (text.length > 800) text = text.substring(0, 800) + '… [קוצר]';
      return { ...msg, text };
    });
}

const SKIP_FILES = new Set([
  'project_map.json', 'package-lock.json', '.gitignore', '.prettierrc.json', 'LICENSE'
]);

async function updateProjectMap(github, ai, owner, repo, affectedFiles, allRepoFiles) {
  const relevantFiles = allRepoFiles.filter(f =>
    !SKIP_FILES.has(f.split('/').pop()) &&
    !f.startsWith('node_modules/') &&
    !f.includes('.git/')
  );

  let projectMap = {
    project_name: repo,
    last_updated: '',
    summary: '',
    tech_stack: [],
    files: {}
  };

  try {
    const existing = await github.getFile(owner, repo, 'project_map.json');
    if (existing) {
      const parsed = JSON.parse(existing);
      // Migrate old nested structure to flat format
      if (!parsed.files && parsed.structure) {
        parsed.files = flattenOldStructure(parsed.structure);
        delete parsed.structure;
      }
      projectMap = { ...projectMap, ...parsed };
      if (!projectMap.files) projectMap.files = {};
    }
  } catch (e) { /* file doesn't exist yet */ }

  // Sync file list: remove deleted files, add new ones
  for (const path of Object.keys(projectMap.files)) {
    if (!relevantFiles.includes(path)) delete projectMap.files[path];
  }
  for (const path of relevantFiles) {
    if (!(path in projectMap.files)) projectMap.files[path] = '';
  }

  // Regenerate descriptions only for files that were changed
  for (const filePath of affectedFiles) {
    if (!SKIP_FILES.has(filePath.split('/').pop())) {
      try {
        const content = await github.getFile(owner, repo, filePath);
        projectMap.files[filePath] = await ai.describeFile(filePath, content);
      } catch (e) {
        console.log(`Could not describe ${filePath}:`, e.message);
      }
    }
  }

  projectMap.last_updated = new Date().toISOString().split('T')[0];

  await github.updateFile(
    owner, repo, 'project_map.json',
    JSON.stringify(projectMap, null, 2),
    'Auto-update project_map.json'
  );

  return projectMap;
}

app.get('/api/github/user-data', async (req, res) => {
  try {
    const token = req.headers['x-github-token'];
    if (!token) throw new Error("Missing GitHub Token");
    const octokit = new Octokit({ auth: token });
    const { data: user } = await octokit.users.getAuthenticated();
    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100
    });
    res.json({ username: user.login, repos: repos.map(r => r.name) });
  } catch (e) {
    res.status(500).json({ error: `GitHub Error: ${e.message}` });
  }
});

// Fetch any file from the active repo (used for README and project_map modals)
app.get('/api/file', async (req, res) => {
  try {
    const { github } = getServices(req);
    const { owner, repo, path } = req.query;
    if (!path || !owner || !repo) return res.status(400).json({ error: 'Missing params: owner, repo, path' });
    const content = await github.getFile(owner, repo, path);
    res.json({ content });
  } catch (e) {
    res.status(404).json({ error: `File not found: ${e.message}` });
  }
});

app.post('/api/chat', chatLimiter, async (req, res) => {
  try {
    const { ai, github } = getServices(req);
    const { prompt, history, context, responseLength, contextFiles } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'שדה prompt חסר או לא תקין.' });
    }
    if (prompt.length > 8000) {
      return res.status(400).json({ error: 'ההודעה ארוכה מדי (מקסימום 8000 תווים).' });
    }
    if (!context?.owner || !context?.repo) {
      return res.json({ response: "חובה לבחור פרויקט בהגדרות." });
    }

    const allFiles = await github.getAiMap(context.owner, context.repo);

    // Always read core context files
    let coreContent = "";
    const coreFiles = ['Gemini.md', 'project_map.json'];
    for (const file of coreFiles) {
      if (allFiles.includes(file)) {
        try {
          const content = await github.getFile(context.owner, context.repo, file);
          coreContent += `\n--- Content of ${file} ---\n${content}\n`;
        } catch (e) {}
      }
    }

    // Dynamically fetch files mentioned in the prompt (fuzzy match)
    let dynamicContent = "";
    const lowerPrompt = prompt.toLowerCase();
    for (const filePath of allFiles) {
      const lowerPath = filePath.toLowerCase();
      const fileName = filePath.split('/').pop().toLowerCase();
      const fileNameNoExt = fileName.split('.').slice(0, -1).join('.').toLowerCase();
      const isRequested =
        lowerPrompt.includes(lowerPath) ||
        lowerPrompt.includes(fileName) ||
        (fileNameNoExt.length > 2 && lowerPrompt.includes(fileNameNoExt));
      if (isRequested && !coreFiles.includes(filePath)) {
        try {
          const content = await github.getFile(context.owner, context.repo, filePath);
          dynamicContent += `\n--- Content of ${filePath} ---\n${content}\n`;
        } catch (e) {}
      }
    }

    // Fetch explicitly pinned context files (user selected from project map)
    let pinnedContent = "";
    if (Array.isArray(contextFiles) && contextFiles.length > 0) {
      for (const filePath of contextFiles) {
        if (!coreFiles.includes(filePath) && !dynamicContent.includes(`Content of ${filePath}`)) {
          try {
            const content = await github.getFile(context.owner, context.repo, filePath);
            pinnedContent += `\n--- Content of ${filePath} (pinned by user) ---\n${content}\n`;
          } catch (e) {}
        }
      }
    }

    const enrichedPrompt = `
${coreContent}
${pinnedContent}
${dynamicContent}

USER MESSAGE: ${prompt}
    `.trim();

    const updatedContext = { ...context, realTimeFileList: allFiles };
    const response = await ai.chat(enrichedPrompt, compressHistory(history), updatedContext, responseLength || 'short');
    res.json({ response });
  } catch (e) {
    console.error("Chat Error:", e.message);
    res.status(500).json({ error: "שגיאה בעיבוד הצ'אט: " + e.message });
  }
});

app.post('/api/execute', executeLimiter, async (req, res) => {
  try {
    const { github, ai } = getServices(req);
    const { plan, context } = req.body;

    if (!plan || !Array.isArray(plan)) {
      return res.status(400).json({ error: "ה-Plan שהתקבל אינו תקין" });
    }
    if (plan.length > 20) {
      return res.status(400).json({ error: "תוכנית גדולה מדי (מקסימום 20 פעולות)." });
    }
    if (!context?.owner || !context?.repo) {
      return res.status(400).json({ error: "חסר owner או repo בקונטקסט." });
    }

    // Capture snapshot of all affected files before making any changes (enables undo)
    const snapshot = [];
    for (const action of plan) {
      for (const file of action.affectedFiles) {
        const content = await github.getFile(context.owner, context.repo, file);
        snapshot.push({ path: file, content });
      }
    }

    for (const action of plan) {
      for (const file of action.affectedFiles) {
        const currentContent = await github.getFile(context.owner, context.repo, file);
        const newContent = await ai.editCode(currentContent, action.description);
        await github.updateFile(context.owner, context.repo, file, newContent, action.description);
      }
    }

    // Update project_map.json after execution
    try {
      const allAffectedFiles = plan.flatMap(a => a.affectedFiles);
      const allFiles = await github.getAiMap(context.owner, context.repo);
      await updateProjectMap(github, ai, context.owner, context.repo, allAffectedFiles, allFiles);
    } catch (e) {
      console.error("project_map update failed:", e.message);
    }

    res.json({ success: true, snapshot });
  } catch (e) {
    console.error("Execution Error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// Undo: restore files from a snapshot captured before the last execution
app.post('/api/undo', executeLimiter, async (req, res) => {
  try {
    const { github } = getServices(req);
    const { snapshot, context } = req.body;

    if (!Array.isArray(snapshot) || snapshot.length === 0) {
      return res.status(400).json({ error: "snapshot חסר או ריק." });
    }
    if (!context?.owner || !context?.repo) {
      return res.status(400).json({ error: "חסר owner או repo בקונטקסט." });
    }

    for (const { path, content } of snapshot) {
      await github.updateFile(context.owner, context.repo, path, content, 'Undo: restore previous version');
    }

    res.json({ success: true });
  } catch (e) {
    console.error("Undo Error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// Scan all repo files and regenerate project_map.json using Flash-Lite
app.post('/api/scan-project', executeLimiter, async (req, res) => {
  try {
    const { github } = getServices(req);
    const aiKey = req.headers['x-ai-key'];
    const liteAi = new AIService('google', aiKey, 'gemini-2.5-flash-lite');
    const { context } = req.body;

    if (!context?.owner || !context?.repo) {
      return res.status(400).json({ error: "חסר owner או repo." });
    }

    const allFiles = await github.getAiMap(context.owner, context.repo);
    const updatedMap = await updateProjectMap(github, liteAi, context.owner, context.repo, allFiles, allFiles);

    res.json({ success: true, mapData: updatedMap });
  } catch (e) {
    console.error("Scan Error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// Analyze repo and create Gemini.md
app.post('/api/create-gemini-md', executeLimiter, async (req, res) => {
  try {
    const { github, ai } = getServices(req);
    const { context } = req.body;

    if (!context?.owner || !context?.repo) {
      return res.status(400).json({ error: "חסר owner או repo." });
    }

    const allFiles = await github.getAiMap(context.owner, context.repo);

    // Read a representative sample of key files to give the AI enough context
    const KEY_PATTERNS = ['package.json', 'README.md', 'App.js', 'app.js', 'index.js', 'main.py', 'app.py'];
    const keyFiles = allFiles.filter(f => KEY_PATTERNS.some(p => f.endsWith(p))).slice(0, 6);

    let keyFilesContent = '';
    for (const f of keyFiles) {
      const content = await github.getFile(context.owner, context.repo, f);
      if (content) keyFilesContent += `\n--- ${f} ---\n${content.substring(0, 2000)}\n`;
    }

    const geminiMdContent = await ai.generateGeminiMd(context.repo, allFiles, keyFilesContent);
    await github.updateFile(context.owner, context.repo, 'Gemini.md', geminiMdContent, 'Create Gemini.md');

    res.json({ success: true });
  } catch (e) {
    console.error("Create Gemini.md Error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// Preview: generate proposed content without committing to GitHub
app.post('/api/preview', executeLimiter, async (req, res) => {
  try {
    const { github, ai } = getServices(req);
    const { plan, context } = req.body;

    if (!plan || !Array.isArray(plan) || !context?.owner || !context?.repo) {
      return res.status(400).json({ error: 'פרמטרים חסרים.' });
    }

    const previews = [];
    for (const action of plan) {
      for (const file of action.affectedFiles) {
        const current = await github.getFile(context.owner, context.repo, file);
        const proposed = await ai.editCode(current, action.description);
        previews.push({ file, current, proposed, description: action.description });
      }
    }
    res.json({ previews });
  } catch (e) {
    console.error("Preview Error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// Compress: summarize the conversation with AI and return a short summary
app.post('/api/compress', chatLimiter, async (req, res) => {
  try {
    const { ai } = getServices(req);
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array required' });
    }
    const convoText = messages
      .filter(m => m.role !== 'bot' || !m.hasPlan)
      .map(m => `${m.role === 'user' ? 'משתמש' : 'סוכן'}: ${m.text || ''}`)
      .join('\n');
    const summary = await ai.summarizeConversation(convoText);
    res.json({ summary });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Save chat to Saved_Chats.json in the active repo
app.post('/api/save-chat', executeLimiter, async (req, res) => {
  try {
    const { github, ai } = getServices(req);
    const { messages, saveType, owner, repo } = req.body;
    if (!owner || !repo || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'owner, repo, messages required' });
    }

    const convoText = messages
      .map(m => `${m.role === 'user' ? 'משתמש' : 'סוכן'}: ${m.text || ''}`)
      .join('\n');

    const [title, summary] = await Promise.all([
      ai.generateTitle(convoText),
      saveType === 'summary' ? ai.summarizeConversation(convoText) : Promise.resolve(null)
    ]);

    const entry = {
      id: Date.now().toString(),
      title,
      date: new Date().toISOString().split('T')[0],
      type: saveType,
      messageCount: messages.length,
      content: saveType === 'summary' ? summary : messages
    };

    let chats = [];
    try {
      const existing = await github.getFile(owner, repo, 'Saved_Chats.json');
      chats = JSON.parse(existing);
    } catch (e) { /* file doesn't exist yet */ }

    chats.unshift(entry);
    // Keep at most 50 saved chats
    if (chats.length > 50) chats = chats.slice(0, 50);

    await github.updateFile(owner, repo, 'Saved_Chats.json', JSON.stringify(chats, null, 2), `Save chat: ${title}`);
    res.json({ success: true, title });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Refine a user prompt (used by raven/owl agent modes)
app.post('/api/refine-prompt', chatLimiter, async (req, res) => {
  try {
    const { ai } = getServices(req);
    const { prompt, context } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt required' });
    const refinedPrompt = await ai.refinePrompt(prompt, context);
    res.json({ refinedPrompt });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Load list of saved chats from the active repo
app.get('/api/saved-chats', async (req, res) => {
  try {
    const { github } = getServices(req);
    const { owner, repo } = req.query;
    if (!owner || !repo) return res.status(400).json({ error: 'owner, repo required' });
    try {
      const content = await github.getFile(owner, repo, 'Saved_Chats.json');
      res.json({ chats: JSON.parse(content) });
    } catch (e) {
      res.json({ chats: [] });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = app;
