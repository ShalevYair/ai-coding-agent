const { GoogleGenerativeAI } = require("@google/generative-ai");

class AIService {
  constructor(provider, apiKey) {
    this.apiKey = apiKey;
    console.log(`🤖 AIService initialized for Gemini 2.5`);
  }

  async generatePlan(prompt, aiMap) {
    try {
      const genAI = new GoogleGenerativeAI(this.apiKey);
      // עדכון למודל 2.5 פלאש המעודכן ל-2026
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const fullPrompt = `You are a professional web developer. 
      Project structure: ${JSON.stringify(aiMap)}
      User request: ${prompt}
      
      Return ONLY a JSON array. No text before or after.
      Format: [{"id": 1, "description": "task description", "affectedFiles": ["path/to/file"]}]`;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      let text = response.text().replace(/```json|```/g, "").trim();
      
      return text;
    } catch (error) {
      console.error("❌ AI Error:", error.message);
      throw new Error(`AI Error: ${error.message}`);
    }
  }
}

module.exports = AIService;
