const express = require('express');
const cors = require('cors');
const GitHubService = require('../server/services/githubService');
const AIService = require('../server/services/aiService');

const app = express();

app.use(cors());
app.use(express.json());

const getContext = (req) => {
  const provider = req.headers['x-ai-provider'] || 'gemini';
  const aiKey = req.headers['x-ai-key'];
  const githubToken = req.headers['x-github-token'];

  if (!aiKey || !githubToken) {
    throw new Error('Missing API Keys in request headers');
  }

  return {
    ai: new AIService(provider, aiKey),
    github: new GitHubService(githubToken)
  };
};

app.post('/api/plan', async (req, res) => {
  try {
    const { ai, github } = getContext(req);
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
    const { ai, github } = getContext(req);
    const { owner, repo, filePath, instructions } = req.body;
    const currentContent = await github.getFile(owner, repo, filePath);
    const newCode = await ai.editCode(currentContent, instructions, []);
    const result = await github.commitFile(owner, repo, filePath, newCode, `AI Edit: ${instructions}`);
    res.json({ success: true, commit: result.data.commit.sha });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
