const express = require('express');
const cors = require('cors');
const GitHubService = require('../server/services/githubService');
const AIService = require('../server/services/aiService');

const app = express();
app.use(cors());
app.use(express.json());

// פונקציית עזר להוצאת שירותים
const getServices = (req) => {
  const aiKey = req.headers['x-ai-key'];
  const githubToken = req.headers['x-github-token'];
  const provider = req.headers['x-ai-provider'] || 'gemini';
  return {
    ai: new AIService(provider, aiKey),
    github: new GitHubService(githubToken)
  };
};

// נתיב חדש: משיכת פרטי משתמש ורשימת רפוזיטוריז
app.get('/api/user/repos', async (req, res) => {
  try {
    const { github } = getServices(req);
    // משיכת שם המשתמש (Owner)
    const user = await github.octokit.rest.users.getAuthenticated();
    // משיכת כל הרפוזיטוריז (עד 100 האחרונים)
    const repos = await github.octokit.rest.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100
    });
    
    res.json({ 
      owner: user.data.login, 
      repos: repos.data.map(r => r.name) 
    });
  } catch (error) {
    res.status(500).json({ error: "נכשל במשיכת נתונים מגיטהאב: " + error.message });
  }
});

// יתר הנתיבים (plan ו-execute) נשארים אותו דבר...
app.post('/api/plan', async (req, res) => {
  try {
    const { ai, github } = getServices(req);
    const { prompt, owner, repo } = req.body;
    const aiMap = await github.getAiMap(owner, repo) || { files: [] };
    const planResponse = await ai.generatePlan(prompt, aiMap);
    res.json({ plan: JSON.parse(planResponse) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/execute', async (req, res) => {
  try {
    const { ai, github } = getServices(req);
    const { owner, repo, filePath, instructions } = req.body;
    const currentContent = await github.getFile(owner, repo, filePath);
    const newCode = await ai.editCode(currentContent, instructions, []);
    await github.commitFile(owner, repo, filePath, newCode, `AI Edit: ${instructions}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
