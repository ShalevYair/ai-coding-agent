const { GoogleGenerativeAI } = require("@google/generative-ai");

class AIService {
  constructor(provider, apiKey) {
    this.provider = provider;
    this.apiKey = apiKey;
    console.log(`🤖 AIService initialized with provider: ${provider}`);
  }

  async generatePlan(prompt, aiMap) {
    console.log("🤖 AI: Starting generatePlan...");
    try {
      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const fullPrompt = `You are a coding assistant. Project structure: ${JSON.stringify(aiMap)}. Task: ${prompt}. 
      Return ONLY a JSON array of steps: [{"id": 1, "description": "...", "affectedFiles": ["..."]}]`;

      console.log("🤖 AI: Sending request to Gemini...");
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();
      
      console.log("🤖 AI: Raw response received:", text);

      // ניקוי סימני Markdown אם ה-AI הוסיף אותם
      const cleanJson = text.replace(/```json|```/g, "").trim();
      return cleanJson;
    } catch (error) {
      console.error("❌ AI Service Error:", error.message);
      throw new Error("AI Failed: " + error.message);
    }
  }
}

module.exports = AIService;
