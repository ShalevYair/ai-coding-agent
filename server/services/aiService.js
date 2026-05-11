const { GoogleGenerativeAI } = require("@google/generative-ai");

class AIService {
  constructor(provider, apiKey) {
    this.apiKey = apiKey;
  }

  async chat(prompt, history, context) {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemInstruction = `
      You are an expert AI Coding Agent. 
      The core of your memory is a file named 'project_map.json'.
      If this file exists in the context, use it to understand the project.
      If it doesn't, your first priority is to help the user create it.
      
      The format for 'project_map.json' should be:
      {
        "project_name": "Name",
        "summary": "Short description",
        "structure": { "filename": "description" },
        "tech_stack": ["HTML", "CSS", "JS"]
      }

      RULES:
      1. Use HEBREW for chat, English for code/paths.
      2. If modifying files (including project_map.json), summarize and add:
         [[[{"id":1,"description":"Update project map","affectedFiles":["project_map.json"]}]]]
      3. Ask for confirmation before using the "[[[" block.
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
