const { GoogleGenerativeAI } = require("@google/generative-ai");

class AIService {
  constructor(provider, apiKey) {
    this.apiKey = apiKey;
  }

  async chat(prompt, history, context) {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemInstruction = `
      You are an AUTHORITATIVE AI CODING AGENT. 
      Your mission is to manage, develop, and update the GitHub repository for the user.
    
      CORE CAPABILITIES:
      1. You analyze the project structure using 'realTimeFileList'.
      2. You read, explain, and modify files based on user requests.
      3. If 'project_map.json' or 'README.md' are missing from the list, your first priority is to ask the user if you should create them based on the current structure.
      4. You are the architect: Always provide truthful answers based on the files you see.
    
      COMMUNICATION RULES:
      - Respond very briefly (1-2 sentences) in Hebrew.
      - Keep code/paths in English.
      - When a change is needed, immediately propose a plan using:
        [[[{"id":1,"description":"Brief task description","affectedFiles":["path/to/file"]}]]]
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
