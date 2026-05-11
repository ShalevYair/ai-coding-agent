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

app.post('/api/chat', async (req, res) => {
  try {
    const { ai, github } = getServices(req);
    const { prompt, history, context } = req.body;

    if (!context.owner || !context.repo) {
      return res.json({ response: "חובה לבחור פרויקט (Repository) כדי שאוכל לסרוק את הקבצים." });
    }

    // 1. שליפת מבנה הקבצים המלא מה-GitHub Service
    // ודא שב-githubService הפונקציה getAiMap משתמשת ב-recursive: true
    const allFiles = await github.getAiMap(context.owner, context.repo);
    
    const filteredFiles = Array.isArray(allFiles) 
      ? allFiles.filter(f => 
          !f.includes('.git/') && 
          !f.includes('node_modules/') && 
          !['HEAD', 'config', 'description', 'index'].includes(f)
        )
      : [];

    // 2. עדכון ה-Context עם רשימת הקבצים בזמן אמת
    const updatedContext = {
      ...context,
      realTimeFileList: filteredFiles, // הזרקה ישירה לרמה הראשונה של ה-context
      projectMap: {
        ...(context.projectMap || {}),
        realTimeFileList: filteredFiles
      }
    };

    const limitedHistory = Array.isArray(history) ? history.slice(-10) : [];

    // 3. שליחה ל-AI - ה-aiService צריך לדעת לשרשר את ה-updatedContext לפרומפט
    const response = await ai.chat(prompt, limitedHistory, updatedContext);
    res.json({ response });
  } catch (e) {
    console.error("Chat Error:", e);
    res.status(500).json({ error: `AI Error: ${e.message}` });
  }
});

app.post('/api/execute', async (req, res) => {
  console.log("--- תחילת ביצוע פקודה ---");
  try {
    const { github, ai } = getServices(req);
    const { plan, context } = req.body;

    // בדיקה שהנתונים הגיעו תקינים
    if (!plan || !Array.isArray(plan)) {
      throw new Error("ה-Plan שהתקבל אינו תקין או שאינו מערך");
    }

    console.log("Plan details:", JSON.stringify(plan, null, 2));

    for (const action of plan) {
      for (const file of action.affectedFiles) {
        console.log(`מנסה לעבוד על קובץ: ${file}`);
        
        let currentContent = ""; 
        try {
          currentContent = await github.getFile(context.owner, context.repo, file);
          console.log(`תוכן קיים נשלף בהצלחה עבור ${file}`);
        } catch (e) {
          console.log(`קובץ חדש או שלא ניתן לקרוא אותו: ${file}`);
        }

        // בדיקה ש-aiService עובד
        console.log("פונה ל-AI ליצירת/עריכת קוד...");
        if (typeof ai.editCode !== 'function') {
          throw new Error("פונקציית ai.editCode לא קיימת ב-AIService");
        }
        
        const newContent = await ai.editCode(currentContent, action.description);
        
        // ביצוע ה-Commit
        console.log(`מבצע Update ב-GitHub עבור: ${file}`);
        const result = await github.updateFile(context.owner, context.repo, file, newContent, action.description);
        console.log("תגובת גיטהאב:", result.status);
      }
    }
    
    res.json({ success: true });
  } catch (e) {
    // הדפסה מפורטת לטרמינל של השרת
    console.error("!!! שגיאת ביצוע קריטית !!!");
    console.error("Message:", e.message);
    console.error("Stack:", e.stack);
    if (e.response) console.error("GitHub Data:", e.response.data);

    // החזרת השגיאה המפורטת לפרונטאנד
    res.status(500).json({ 
      error: e.message, 
      details: e.response ? e.response.data : "No extra data",
      step: "Check server logs for full stack trace"
    });
  }
});

module.exports = app;
