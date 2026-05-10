const { GoogleGenerativeAI } = require('@google/generative-ai');
const Anthropic = require('@anthropic-ai/sdk');

class AIService {
  constructor(provider, apiKey) {
    this.provider = provider;
    this.apiKey = apiKey;
    
    if (provider === 'gemini') {
      const genAI = new GoogleGenerativeAI(apiKey);
      this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    } else if (provider === 'claude') {
      this.client = new Anthropic({ apiKey });
    }
  }

  // שלב התכנון: יצירת רשימת צעדים לביצוע
  async generatePlan(prompt, aiMap) {
    const systemPrompt = `You are a technical architect. Based on the following file map:
    ${JSON.stringify(aiMap)}
    
    Create a step-by-step technical plan to fulfill this request: "${prompt}"
    Return the plan as a JSON array of steps. Each step should have: "id", "description", and "affectedFiles" (array).`;

    return await this._askAI(systemPrompt);
  }

  // שלב הביצוע: עריכת קוד של קובץ ספציפי
  async editCode(currentCode, instructions, contextFiles = []) {
    const systemPrompt = `You are an expert coder. Edit the following file:
    ---
    ${currentCode}
    ---
    Instructions: ${instructions}
    Related context: ${JSON.stringify(contextFiles)}
    
    Return ONLY the full new code of the file. No explanations.`;

    return await this._askAI(systemPrompt);
  }

  async _askAI(prompt) {
    if (this.provider === 'gemini') {
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } else {
      const msg = await this.client.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      });
      return msg.content[0].text;
    }
  }
}

module.exports = AIService;