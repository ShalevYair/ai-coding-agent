const { GoogleGenerativeAI } = require("@google/generative-ai");

class AIService {
  constructor(provider, apiKey) {
    this.apiKey = apiKey;
  }

  async chat(prompt, history, context) {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemInstruction = `
      You are an expert AI Coding Agent for the repo: ${context.repo}.
      Project Context: ${JSON.stringify(context.projectMap)}
      README: ${context.readme}

      RULES:
      1. Use HEBREW for chat, English for code/paths.
      2. If modifying files, summarize briefly and add this JSON:
         [[[{"id":1,"description":"desc","affectedFiles":["path"]}]]]
      3. ONLY technical tasks. Refuse research/essays.
      4. Always ask for confirmation before using the "[[[" block.
    `;

    // מיפוי ההיסטוריה לפורמט של גוגל
    const formattedHistory = (history || []).map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }],
    }));

    // תיקון קריטי: גוגל מחייב שההיסטוריה תתחיל ב-'user'
    const firstUserIndex = formattedHistory.findIndex(h => h.role === 'user');
    const cleanHistory = firstUserIndex > -1 ? formattedHistory.slice(firstUserIndex) : [];

    const chat = model.startChat({
      history: cleanHistory,
    });

    const result = await chat.sendMessage(systemInstruction + "\nUser Input: " + prompt);
    return result.response.text();
  }

  async editCode(currentCode, instructions) {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Current Code:\n${currentCode}\n\nTask: ${instructions}\n\nReturn ONLY the new full code. No markdown.`;
    const result = await model.generateContent(prompt);
    return result.response.text().replace(/```[a-z]*|```/g, "").trim();
  }
}

module.exports = AIService;
