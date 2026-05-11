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

app.get('/api/user/repos', async (req, res) => {
  try {
    const { github } = getServices(req);
    const user = await github.octokit.rest.users.getAuthenticated();
    const repos = await github.octokit.rest.repos.listForAuthenticatedUser({ sort: 'updated' });
    res.json({ owner: user.data.login, repos: repos.data.map(r => r.name) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/plan', async (req, res) => {
  try {
    const { ai, github } = getServices(req);
    const aiMap = await github.getAiMap(req.body.owner, req.body.repo);
    const plan = await ai.generatePlan(req.body.prompt, aiMap);
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

module.exports = app;
