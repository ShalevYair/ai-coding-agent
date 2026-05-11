const { GoogleGenerativeAI } = require("@google/generative-ai");

class AIService {
  constructor(provider, apiKey) {
    this.apiKey = apiKey;
  }

  async chat(prompt, history, context) {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemInstruction = `
      You are an EXPERT AI CODING AGENT. Connected to GitHub via backend.
      Context: 'context.projectMap' and 'context.projectMap.realTimeFileList'.

      STRICT RULES:
      1. RESPOND VERY BRIEFLY (1-2 sentences). Hebrew for chat, English for code.
      2. NEVER deny access to files. Use the provided context.
      3. Project Map Format: { "project_name": "", "summary": "", "structure": {}, "tech_stack": [] }
      4. To modify files: Summary -> Wait for confirmation -> Plan block:
         [[[{"id":1,"description":"desc","affectedFiles":["path"]}]]]
    `;
    
    // הופכים את ההיסטוריה לפורמט של גוגל
    const formattedHistory = (history || []).map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }],
    }));

    // התיקון הקריטי: גוגל דורש שההודעה הראשונה תהיה של המשתמש (user)
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
