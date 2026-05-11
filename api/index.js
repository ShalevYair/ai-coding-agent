const express = require('express');
const cors = require('cors');
const GitHubService = require('../server/services/githubService');
const AIService = require('../server/services/aiService');

const app = express();
app.use(cors()); app.use(express.json());

const getServices = (req) => ({
  ai: new AIService('gemini', req.headers['x-ai-key']),
  github: new GitHubService(req.headers['x-github-token'])
});

// משיכת רשימת רפוזיטוריז
app.get('/api/user/repos', async (req, res) => {
  try {
    const { github } = getServices(req);
    const user = await github.octokit.rest.users.getAuthenticated();
    const repos = await github.octokit.rest.repos.listForAuthenticatedUser({ sort: 'updated' });
    res.json({ owner: user.data.login, repos: repos.data.map(r => r.name) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// נתיב חדש: משיכת ה-README והמפה (Context)
app.get('/api/repo/context', async (req, res) => {
  try {
    const { github } = getServices(req);
    const { owner, repo } = req.query;
    const readme = await github.getFile(owner, repo, 'README.md');
    const projectMap = await github.getFile(owner, repo, 'project_map.json');
    res.json({ readme, projectMap: projectMap ? JSON.parse(projectMap) : null });
  } catch (e) { res.json({ readme: '', projectMap: null }); }
});

app.post('/api/plan', async (req, res) => {
  try {
    const { ai, github } = getServices(req);
    const { prompt, owner, repo, context } = req.body;
    const aiMap = await github.getAiMap(owner, repo);
    // שולחים ל-AI גם את המפה הקיימת ואת ה-README כדי לחסוך טוקנים
    const plan = await ai.generatePlan(prompt, aiMap, context);
    res.json({ plan: JSON.parse(plan) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/execute', async (req, res) => {
  try {
    const { ai, github } = getServices(req);
    const { owner, repo, filePath, instructions } = req.body;
    const oldCode = await github.getFile(owner, repo, filePath);
    const newCode = await ai.editCode(oldCode, instructions);
    await github.commitFile(owner, repo, filePath, newCode, instructions);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// נתיב חדש: עדכון המפה וה-README בסוף התהליך
app.post('/api/repo/finalize', async (req, res) => {
  try {
    const { ai, github } = getServices(req);
    const { owner, repo, prompt } = req.body;
    const aiMap = await github.getAiMap(owner, repo);
    
    // ה-AI מייצר README ומפה מעודכנים על סמך מה שקרה
    const updatePrompt = `Based on the last task: "${prompt}", generate an updated README.md and a project_map.json.`;
    const newReadme = await ai.editCode('', `Update README for: ${prompt}`);
    const newMap = await ai.generatePlan(`Update project map JSON for: ${prompt}`, aiMap);
    
    await github.commitFile(owner, repo, 'README.md', newReadme, 'Update README');
    await github.commitFile(owner, repo, 'project_map.json', newMap, 'Update Project Map');
    
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = app;
