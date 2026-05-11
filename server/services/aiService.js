const { GoogleGenerativeAI } = require("@google/generative-ai");

class AIService {
  constructor(provider, apiKey) {
    this.apiKey = apiKey;
  }

  async chat(prompt, history, context) {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemInstruction = `
      You are an EXPERT AI CODING AGENT connected to GitHub.
      The actual files are in 'context.projectMap.realTimeFileList'.
    
      STRICT RULES:
      1. RESPOND VERY BRIEFLY (1-2 sentences). Hebrew for chat, English for code.
      2. NEVER INVENT FILES. Use ONLY the provided list. If the list is empty, say the folder is empty.
      3. NEVER mention internal names like 'context' or 'realTimeFileList'.
      4. If you see files like 'main.py' or 'requirements.txt' that ARE NOT in the list, DO NOT mention them.
      5. To CREATE or MODIFY files: 1-sentence summary -> Wait for OK -> Plan block:
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
