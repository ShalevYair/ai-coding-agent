const express = require('express');
const cors = require('cors');
const GitHubService = require('../server/services/githubService');
const AIService = require('../server/services/aiService');

const app = express();
app.use(cors()); 
app.use(express.json());

const getServices = (req) => ({
  ai: new AIService('gemini', req.headers['x-ai-key']),
  github: new GitHubService(req.headers['x-github-token'])
});

app.get('/api/user/repos', async (req, res) => {
  try {
    const { github } = getServices(req);
    const user = await github.octokit.rest.users.getAuthenticated();
    const repos = await github.octokit.rest.repos.listForAuthenticatedUser({ sort: 'updated' });
    res.json({ owner: user.data.login, repos: repos.data.map(r => r.name) });
  } catch (e) { res.status(500).json({ error: `שגיאת גיטהאב: ${e.message}` }); }
});

app.get('/api/repo/context', async (req, res) => {
  try {
    const { github } = getServices(req);
    const { owner, repo } = req.query;
    const readme = await github.getFile(owner, repo, 'README.md');
    const projectMapRaw = await github.getFile(owner, repo, 'project_map.json');
    
    // בדיקה אם המפה קיימת ותקינה
    let projectMap = null;
    if (projectMapRaw) {
      try { projectMap = JSON.parse(projectMapRaw); } catch(err) { projectMap = null; }
    }
    
    res.json({ readme, projectMap });
  } catch (e) { res.json({ readme: '', projectMap: null }); }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { ai } = getServices(req);
    const { prompt, history, context } = req.body;
    
    // אם חסר מפתח AI, נתריע מיד
    if (!req.headers['x-ai-key']) throw new Error("חסר Gemini API Key בהגדרות");

    const response = await ai.chat(prompt, history, context);
    res.json({ response });
  } catch (e) { 
    console.error(e);
    res.status(500).json({ error: `שגיאת AI: ${e.message}` }); 
  }
});

app.post('/api/execute', async (req, res) => {
  try {
    const { ai, github } = getServices(req);
    const { owner, repo, filePath, instructions } = req.body;
    const oldCode = await github.getFile(owner, repo, filePath);
    const newCode = await ai.editCode(oldCode, instructions);
    await github.commitFile(owner, repo, filePath, newCode, instructions);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: `שגיאת ביצוע: ${e.message}` }); }
});

app.post('/api/repo/finalize', async (req, res) => {
  try {
    const { ai, github } = getServices(req);
    const { owner, repo, prompt } = req.body;
    const aiMap = await github.getAiMap(owner, repo);
    
    // שימוש ב-editCode כדי לייצר README ו-Map
    const newReadme = await ai.editCode('', `צור קובץ README.md מעודכן לפרויקט שבו הרגע עשינו: ${prompt}`);
    const newMap = await ai.editCode('', `צור קובץ project_map.json (פורמט JSON בלבד!) עבור רשימת הקבצים הבאה: ${JSON.stringify(aiMap)}`);
    
    await github.commitFile(owner, repo, 'README.md', newReadme, 'AI: Update README');
    await github.commitFile(owner, repo, 'project_map.json', newMap, 'AI: Update Project Map');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: `שגיאת סנכרון סופי: ${e.message}` }); }
});

module.exports = app;
