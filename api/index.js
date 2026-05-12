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

// api/index.js - עדכון נתיב ה-Chat
app.post('/api/chat', async (req, res) => {
  try {
    const { ai, github } = getServices(req);
    const { prompt, history, context } = req.body;

    if (!context.owner || !context.repo) {
      return res.json({ response: "חובה לבחור פרויקט בהגדרות." });
    }

    // 1. שליפת רשימת הקבצים המעודכנת
    const allFiles = await github.getAiMap(context.owner, context.repo);
    
    // 2. קריאה אוטומטית של "קבצי זיכרון" (הסוכן תמיד יראה אותם)
    let coreContent = "";
    const coreFiles = ['Gemini.md', 'project_map.json'];
    
    for (const file of coreFiles) {
      if (allFiles.includes(file)) {
        try {
          const content = await github.getFile(context.owner, context.repo, file);
          coreContent += `\n--- Content of ${file} (Core File) ---\n${content}\n`;
        } catch (e) { console.log(`Failed to read core file: ${file}`); }
      }
    }

    // 3. זיהוי דינמי חכם במיוחד (Fuzzy matching)
    let dynamicContent = "";
    const lowerPrompt = prompt.toLowerCase();
    
    for (const filePath of allFiles) {
      const lowerPath = filePath.toLowerCase();
      const fileName = filePath.split('/').pop().toLowerCase();
      const fileNameNoExt = fileName.split('.').slice(0, -1).join('.').toLowerCase();
    
      // בודק אם השאלה מכילה את הנתיב המלא, את שם הקובץ, או את השם בלי הסיומת (למשל TEST)
      const isRequested = lowerPrompt.includes(lowerPath) || 
                         lowerPrompt.includes(fileName) || 
                         (fileNameNoExt.length > 2 && lowerPrompt.includes(fileNameNoExt));
    
      if (isRequested && !coreFiles.includes(filePath)) {
        try {
          console.log(`🔍 Smart Fetching: ${filePath}`);
          const content = await github.getFile(context.owner, context.repo, filePath);
          dynamicContent += `\n--- Content of ${filePath} ---\n${content}\n`;
        } catch (e) {
          console.log(`❌ Failed to fetch ${filePath}`);
        }
      }
    }

    // 4. בניית הפרומפט המועשר (Enriched Prompt)
    // אנחנו מזריקים לי את כל הידע לפני שאני בכלל עונה
    const enrichedPrompt = `
      Project Context for ${context.owner}/${context.repo}:
      Files in repo: ${allFiles.join(', ')}
      
      ${coreContent}
      ${dynamicContent}
      
      User Message: ${prompt}
    `;

    // 5. עדכון ה-Context עבור ה-AI (כדי שאדע מה רשימת הקבצים)
    const updatedContext = {
      ...context,
      realTimeFileList: allFiles
    };

    const response = await ai.chat(enrichedPrompt, history.slice(-10), updatedContext);
    res.json({ response });

  } catch (e) {
    console.error("Chat Logic Error:", e.message);
    res.status(500).json({ error: "שגיאה בעיבוד הצ'אט: " + e.message });
  }
});


app.post('/api/execute', async (req, res) => {
  try {
    const { github, ai } = getServices(req);
    const { plan, context } = req.body;

    // הגנה: אם ה-Plan לא הגיע כמערך, לא ממשיכים
    if (!plan || !Array.isArray(plan)) {
      return res.status(400).json({ error: "ה-Plan שהתקבל אינו תקין" });
    }

    for (const action of plan) {
      for (const file of action.affectedFiles) {
        const currentContent = await github.getFile(context.owner, context.repo, file);
        const newContent = await ai.editCode(currentContent, action.description);
        // קריאה לפונקציה המעודכנת ב-Service
        await github.updateFile(context.owner, context.repo, file, newContent, action.description);
      }
    }
    res.json({ success: true });
  } catch (e) {
    console.error("Execution Error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = app;
