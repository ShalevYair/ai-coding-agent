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
      return res.json({ response: "חובה לבחור פרויקט." });
    }

    // 1. קבלת רשימת הקבצים
    const allFiles = await github.getAiMap(context.owner, context.repo);
    const filteredFiles = Array.isArray(allFiles) ? allFiles.filter(f => !f.includes('.git/')) : [];

    // 2. מנגנון "קריאה אוטומטית":
    // אנחנו בודקים אם המשתמש הזכיר שם של קובץ שקיים ברשימה
    let injectedContent = "";
    for (const fileName of filteredFiles) {
      if (prompt.includes(fileName)) {
        console.log(`קורא תוכן עבור הקובץ: ${fileName}`);
        const content = await github.getFile(context.owner, context.repo, fileName);
        injectedContent += `\nContent of ${fileName}:\n${content}\n`;
      }
    }

    // 3. הזרקת התוכן להודעה שנשלחת ל-AI
    const enrichedPrompt = injectedContent 
      ? `Base Context: The user is asking about specific files.\n${injectedContent}\n\nUser Question: ${prompt}`
      : prompt;

    const updatedContext = {
      ...context,
      realTimeFileList: filteredFiles
    };

    const response = await ai.chat(enrichedPrompt, history.slice(-10), updatedContext);
    res.json({ response });
  } catch (e) {
    res.status(500).json({ error: e.message });
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
