const { GoogleGenerativeAI } = require("@google/generative-ai");

class AIService {
  constructor(provider, apiKey) {
    this.apiKey = apiKey;
  }

  async generatePlan(prompt, aiMap) {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const fullPrompt = `You are a developer. Project files: ${JSON.stringify(aiMap)}. 
    Task: ${prompt}.
    Return a JSON array of steps. Each description should be SHORT (max 10 words).
    Example: [{"id":1,"description":"Create basic HTML structure","affectedFiles":["index.html"]}]
    Return ONLY JSON.`;
    
    const result = await model.generateContent(fullPrompt);
    return result.response.text().replace(/```json|```/g, "").trim();
  }

  async editCode(currentCode, instructions) {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Current code: ${currentCode || "Empty file"}. 
    Task: ${instructions}. 
    Write the COMPLETE code for this file. 
    Return ONLY the code. No explanations, no markdown backticks.`;
    
    const result = await model.generateContent(prompt);
    return result.response.text().replace(/```[a-z]*|```/g, "").trim();
  }
}

module.exports = AIService;
