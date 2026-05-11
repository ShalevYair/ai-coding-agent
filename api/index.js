const express = require('express');
const cors = require('cors');
const { Octokit } = require("@octokit/rest");
const GitHubService = require('../server/services/githubService');
const AIService = require('../server/services/aiService');

const app = express();
app.use(cors());
app.use(express.json());

// פונקציית עזר להזרקת השירותים
const getServices = (req) => {
  const aiKey = req.headers['x-ai-key'];
  const githubToken = req.headers['x-github-token'];
  return {
    github: new GitHubService(githubToken),
    ai: new AIService('google', aiKey)
  };
};

// 1. הבאת פרטי משתמש ורשימת פרויקטים (אוטומטי)
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

// 2. נתיב הצ'אט המרכזי (כולל סינון קבצים והגבלת היסטוריה)
app.post('/api/chat', async (req, res) => {
  try {
    const { ai, github } = getServices(req);
    const { prompt, history, context } = req.body;

    if (!context.owner || !context.repo) {
      return res.json({ response: "חובה לבחור פרויקט (Repository) בהגדרות כדי שאוכל לראות את הקבצים." });
    }

    // הגבלת היסטוריה ל-10 הודעות אחרונות לשמירה על פוקוס וחסכון בטוקנים
    const limitedHistory = Array.isArray(history) ? history.slice(-10) : [];

    // הבאת קבצים וסינון קבצי מערכת של גיט
    const allFiles = await github.getAiMap(context.owner, context.repo);
    const filteredFiles = Array.isArray(allFiles) 
      ? allFiles.filter(f => !f.includes('.git/') && !['HEAD', 'config', 'description', 'index'].includes(f))
      : [];
    
    const updatedContext = {
      ...context,
      projectMap: {
        ...(context.projectMap || {}),
        realTimeFileList: filteredFiles
      }
    };

    const response = await ai.chat(prompt, limitedHistory, updatedContext);
    res.json({ response });
  } catch (e) {
    console.error("Chat Error:", e);
    res.status(500).json({ error: `AI Error: ${e.message}` });
  }
});

// 3. ביצוע שינויים (תומך ביצירת קבצים חדשים)
app.post('/api/execute', async (req, res) => {
  try {
    const { github, ai } = getServices(req);
    const { plan, context } = req.body;

    for (const action of plan) {
      for (const file of action.affectedFiles) {
        let currentContent = ""; 
        try {
          // מנסה לקרוא תוכן. אם הקובץ חדש, הפונקציה תזרוק שגיאה - אנחנו נתפוס אותה ונתחיל עם תוכן ריק.
          currentContent = await github.getFile(context.owner, context.repo, file);
        } catch (e) {
          console.log(`מזהה קובץ חדש ליצירה: ${file}`);
        }

        const newContent = await ai.editCode(currentContent, action.description);
        await github.updateFile(context.owner, context.repo, file, newContent, action.description);
      }
    }
    res.json({ success: true });
  } catch (e) {
    console.error("Execution Error:", e);
    res.status(500).json({ error: `שגיאת ביצוע: ${e.message}` });
  }
});

module.exports = app;

if (require.main === module) {
  app.listen(3001, () => console.log('Server running on port 3001'));
}
