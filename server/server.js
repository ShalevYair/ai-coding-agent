const express = require('express');
const cors = require('cors');
const GitHubService = require('./services/githubService');
const AIService = require('./services/aiService');

const app = express();

app.use(cors());
app.use(express.json());

// פונקציה לחילוץ נתונים מהבקשה עם לוגים לזיהוי שגיאות
const getContext = (req) => {
  console.log("--- New Request Received ---");
  const provider = req.headers['x-ai-provider'] || 'gemini';
  const aiKey = req.headers['x-ai-key'];
  const githubToken = req.headers['x-github-token'];

  // בדיקה אם המפתחות הגיעו מהדפדפן
  if (!aiKey) console.error("❌ Missing AI Key in Headers");
  if (!githubToken) console.error("❌ Missing GitHub Token in Headers");

  if (!aiKey || !githubToken) {
    throw new Error('Missing API Keys in request headers');
  }

  console.log(`✅ Context OK. Provider: ${provider}`);
  return {
    ai: new AIService(provider, aiKey),
    github: new GitHubService(githubToken)
  };
};

// מסלול יצירת תוכנית (Planning)
app.post('/api/plan', async (req, res) => {
  console.log("🚀 Route /api/plan hit");
  try {
    const { ai, github } = getContext(req);
    const { prompt, owner, repo } = req.body;
    
    console.log(`Attempting plan for: ${owner}/${repo} with prompt: ${prompt}`);

    // שליפת מבנה הפרויקט
    const aiMap = await github.getAiMap(owner, repo) || { files: [] };
    console.log("📂 AI Map fetched successfully");

    // יצירת התוכנית על ידי ה-AI
    const planResponse = await ai.generatePlan(prompt, aiMap);
    console.log("🤖 AI Response received");

    // ניסיון לנתח את ה-JSON שחזר מה-AI
    const cleanPlan = JSON.parse(planResponse);
    console.log("✅ Plan parsed successfully");

    res.json({ plan: cleanPlan });
  } catch (error) {
    console.error("🔥 SERVER ERROR in /api/plan:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// מסלול ביצוע משימה (Execution)
app.post('/api/execute', async (req, res) => {
  console.log("🚀 Route /api/execute hit");
  try {
    const { ai, github } = getContext(req);
    const { owner, repo, filePath, instructions } = req.body;

    console.log(`Executing on file: ${filePath}`);

    const currentFileContent = await github.getFile(owner, repo, filePath);
    const newCode = await ai.editCode(currentFileContent, instructions, []);
    
    const commitResult = await github.commitFile(
      owner, repo, filePath, newCode, `AI Edit: ${instructions.substring(0, 30)}`
    );

    console.log("✅ Commit successful");
    res.json({ success: true, commit: commitResult.data.commit.sha });
  } catch (error) {
    console.error("🔥 SERVER ERROR in /api/execute:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ייצוא האפליקציה עבור Vercel
module.exports = app;
