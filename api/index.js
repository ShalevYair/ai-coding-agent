const express = require('express');
const cors = require('cors');
const { Octokit } = require("@octokit/rest");
const GitHubService = require('../server/services/githubService');
const AIService = require('../server/services/aiService');

const app = express();
app.use(cors());
app.use(express.json());

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

app.post('/api/chat', async (req, res) => {
  try {
    const { ai, github } = getServices(req);
    const { prompt, history, context, responseLength } = req.body;

    if (!context.owner || !context.repo) {
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

    const enrichedPrompt = `
${coreContent}
${dynamicContent}

USER MESSAGE: ${prompt}
    `.trim();

    const updatedContext = { ...context, realTimeFileList: allFiles };
    const response = await ai.chat(enrichedPrompt, history.slice(-10), updatedContext, responseLength || 'short');
    res.json({ response });
  } catch (e) {
    console.error("Chat Error:", e.message);
    res.status(500).json({ error: "שגיאה בעיבוד הצ'אט: " + e.message });
  }
});

app.post('/api/execute', async (req, res) => {
  try {
    const { github, ai } = getServices(req);
    const { plan, context } = req.body;

    if (!plan || !Array.isArray(plan)) {
      return res.status(400).json({ error: "ה-Plan שהתקבל אינו תקין" });
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

    res.json({ success: true });
  } catch (e) {
    console.error("Execution Error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = app;
