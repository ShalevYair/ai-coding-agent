const express = require('express');
const cors = require('cors');
const GitHubService = require('./services/githubService');
const AIService = require('./services/aiService');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Middleware לחילוץ מפתחות מה-Headers
const getContext = (req) => {
  const provider = req.headers['x-ai-provider']; // 'gemini' או 'claude'
  const aiKey = req.headers['x-ai-key'];
  const githubToken = req.headers['x-github-token'];

  if (!aiKey || !githubToken) {
    throw new Error('Missing API Keys (AI or GitHub)');
  }

  return {
    ai: new AIService(provider, aiKey),
    github: new GitHubService(githubToken)
  };
};

// מסלול ליצירת תוכנית עבודה (Planning)
app.post('/api/plan', async (req, res) => {
  try {
    const { ai, github } = getContext(req);
    const { prompt, owner, repo } = req.body;

    // שליפת המפה (אם קיימת) כדי לתת ל-AI קונטקסט על הפרויקט
    const aiMap = await github.getAiMap(owner, repo) || { files: [] };
    
    const plan = await ai.generatePlan(prompt, aiMap);
    res.json({ plan: JSON.parse(plan) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// מסלול לביצוע שלב ספציפי (Execution)
app.post('/api/execute', async (req, res) => {
  try {
    const { ai, github } = getContext(req);
    const { owner, repo, filePath, instructions, contextPaths } = req.body;

    // 1. שליפת הקוד הנוכחי של הקובץ
    const currentFileContent = await github.getFile(owner, repo, filePath);
    
    // 2. שליפת קבצי קונטקסט נוספים אם המשתמש/AI ביקשו
    let contextData = [];
    if (contextPaths) {
      for (const path of contextPaths) {
        const content = await github.getFile(owner, repo, path);
        contextData.push({ path, content });
      }
    }

    // 3. עריכת הקוד באמצעות AI
    const newCode = await ai.editCode(currentFileContent, instructions, contextData);

    // 4. ביצוע Commit חזרה לגיטהאב
    // הערה: בשלב זה אנחנו מבצעים Commit ישיר. בעתיד אפשר להוסיף כאן יצירת Branch.
    const commitResult = await github.commitFile(
      owner, 
      repo, 
      filePath, 
      newCode, 
      `AI Agent: ${instructions.substring(0, 50)}...`
    );

    res.json({ success: true, commit: commitResult.data.commit.sha });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
