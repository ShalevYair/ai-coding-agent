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

// משיכת רשימת רפוזיטוריז
app.get('/api/user/repos', async (req, res) => {
  try {
    const { github } = getServices(req);
    const user = await github.octokit.rest.users.getAuthenticated();
    const repos = await github.octokit.rest.repos.listForAuthenticatedUser({ sort: 'updated' });
    res.json({ owner: user.data.login, repos: repos.data.map(r => r.name) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// משיכת README ומפה
app.get('/api/repo/context', async (req, res) => {
  try {
    const { github } = getServices(req);
    const { owner, repo } = req.query;
    const readme = await github.getFile(owner, repo, 'README.md');
    const projectMap = await github.getFile(owner, repo, 'project_map.json');
    res.json({ readme, projectMap: projectMap ? JSON.parse(projectMap) : null });
  } catch (e) { res.json({ readme: '', projectMap: null }); }
});

// --- הנתיב החדש של הצ'אט ---
app.post('/api/chat', async (req, res) => {
  try {
    const { ai } = getServices(req);
    const { prompt, history, context } = req.body;
    // הסוכן מחליט אם לענות סתם או להציע תוכנית עבודה
    const response = await ai.chat(prompt, history, context);
    res.json({ response });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ביצוע עדכון קוד
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

// עדכון סופי של README ומפה
app.post('/api/repo/finalize', async (req, res) => {
  try {
    const { ai, github } = getServices(req);
    const { owner, repo, prompt } = req.body;
    const aiMap = await github.getAiMap(owner, repo);
    const newReadme = await ai.editCode('', `Update README for task: ${prompt}`);
    const newMap = await ai.editCode('', `Create a JSON project map for files: ${JSON.stringify(aiMap)}`);
    await github.commitFile(owner, repo, 'README.md', newReadme, 'Update README');
    await github.commitFile(owner, repo, 'project_map.json', newMap, 'Update Project Map');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = app;
