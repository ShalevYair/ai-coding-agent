const { GoogleGenerativeAI } = require("@google/generative-ai");

class AIService {
  constructor(provider, apiKey) {
    this.apiKey = apiKey;
  }

  async chat(prompt, history, context) {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    // שימוש במודל 2.5 פלאש כפי שסיכמנו
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemInstruction = `
      You are an expert AI Coding Agent. 
      Current Project Context: ${JSON.stringify(context.projectMap)}
      README: ${context.readme}

      RULES:
      1. Use HEBREW for chat, but keep code and file paths in English.
      2. If the user wants to modify files, summarize the plan and add this EXACT JSON block at the end:
         [[[{"id":1,"description":"Short task desc","affectedFiles":["path/to/file"]}]]]
      3. Do NOT perform non-coding tasks (research, essays, etc.).
      4. Always ask for confirmation before "[[[" block.
    `;

    // אתחול צ'אט עם היסטוריה (מטפל במקרה שהיא ריקה)
    const chat = model.startChat({
      history: (history || []).map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }],
      })),
    });

    const result = await chat.sendMessage(systemInstruction + "\nUser Input: " + prompt);
    return result.response.text();
  }

  async editCode(currentCode, instructions) {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Current Code:\n${currentCode}\n\nTask: ${instructions}\n\nReturn ONLY the new code. No markdown.`;
    const result = await model.generateContent(prompt);
    return result.response.text().replace(/```[a-z]*|```/g, "").trim();
  }
}

module.exports = AIService;
