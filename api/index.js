const express = require('express');
const cors = require('cors');
const { Octokit } = require("@octokit/rest");
const GitHubService = require('../server/services/githubService');
const AIService = require('../server/services/aiService');

const app = express();
app.use(cors());
app.use(express.json());

// פונקציית עזר להזרקת השירותים (Services) לכל בקשה
const getServices = (req) => {
  const aiKey = req.headers['x-ai-key'];
  const githubToken = req.headers['x-github-token'];
  
  const github = new GitHubService(githubToken);
  const ai = new AIService('google', aiKey);
  
  return { github, ai };
};

// 1. נתיב חדש: הבאת פרטי משתמש ורשימת פרויקטים מגיטהאב
app.get('/api/github/user-data', async (req, res) => {
  try {
    const token = req.headers['x-github-token'];
    if (!token) throw new Error("Missing GitHub Token");

    const octokit = new Octokit({ auth: token });
    
    // משיכת שם המשתמש
    const { data: user } = await octokit.users.getAuthenticated();
    
    // משיכת 100 הרפוזיטורים האחרונים שעודכנו
    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100
    });

    res.json({
      username: user.login,
      repos: repos.map(r => r.name)
    });
  } catch (e) {
    res.status(500).json({ error: `GitHub Error: ${e.message}` });
  }
});

// 2. נתיב הצ'אט המרכזי
app.post('/api/chat', async (req, res) => {
  try {
    const { ai, github } = getServices(req);
    const { prompt, history, context } = req.body;

    // הבאת רשימת הקבצים האמיתית בזמן אמת מגיטהאב
    const realTimeFiles = await github.getAiMap(context.owner, context.repo);
    
    const updatedContext = {
      ...context,
      projectMap: {
        ...(context.projectMap || {}),
        realTimeFileList: realTimeFiles
      }
    };

    const response = await ai.chat(prompt, history, updatedContext);
    res.json({ response });
  } catch (e) {
    res.status(500).json({ error: `AI Error: ${e.message}` });
  }
});

// 3. נתיב ביצוע המשימות (Commit לגיטהאב)
app.post('/api/execute', async (req, res) => {
  try {
    const { github, ai } = getServices(req);
    const { plan, context } = req.body;

    for (const file of plan[0].affectedFiles) {
      const currentContent = await github.getFile(context.owner, context.repo, file);
      const newContent = await ai.editCode(currentContent, plan[0].description);
      await github.updateFile(context.owner, context.repo, file, newContent, plan[0].description);
    }

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: `Execution Error: ${e.message}` });
  }
});

// ייצוא עבור Vercel
module.exports = app;

// רק עבור הרצה מקומית (לא חובה ב-Vercel)
if (require.main === module) {
  app.listen(3001, () => console.log('Server running on port 3001'));
}
