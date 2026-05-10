const { GoogleGenerativeAI } = require("@google/generative-ai");

class AIService {
  constructor(provider, apiKey) {
    this.provider = provider;
    this.apiKey = apiKey;
    console.log(`🤖 AIService initialized`);
  }

  async generatePlan(prompt, aiMap) {
    console.log("🤖 AI: Starting generatePlan...");
    try {
      const genAI = new GoogleGenerativeAI(this.apiKey);
      
      // משתמשים במודל 1.5 Flash - השם המעודכן ביותר
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const fullPrompt = `You are an expert coding assistant. 
      Project structure: ${JSON.stringify(aiMap)}
      Task: ${prompt}
      
      Return ONLY a valid JSON array of steps. No markdown, no triple backticks.
      Format: [{"id": 1, "description": "step text", "affectedFiles": ["path/to/file"]}]`;

      console.log("🤖 AI: Sending request to Gemini...");
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      let text = response.text();
      
      console.log("🤖 AI: Raw response received");

      // ניקוי חזק של התשובה כדי למנוע שגיאות JSON
      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      
      return cleanJson;
    } catch (error) {
      console.error("❌ AI Service Error:", error.message);
      // אם המודל הספציפי לא נמצא, ננסה להחזיר הודעה ברורה
      if (error.message.includes("404")) {
        throw new Error("המודל gemini-1.5-flash לא נמצא. וודא שה-API Key שלך תקין ותומך במודל זה.");
      }
      throw error;
    }
  }
}

module.exports = AIService;
