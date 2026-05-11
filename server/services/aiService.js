const { GoogleGenerativeAI } = require("@google/generative-ai");

class AIService {
  constructor(provider, apiKey) {
    this.apiKey = apiKey;
  }

  async chat(prompt, history, context) {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const systemInstruction = `
      You are a specialized coding agent for the GitHub repo: ${context.repo}.
      Context: ${JSON.stringify(context.projectMap)}. README: ${context.readme}.
      
      STRICT RULES:
      1. Only perform coding or technical tasks. 
      2. If asked for research papers, essays, or non-tech tasks, say: "אני מתמחה בתכנות בלבד. לא אוכל לעזור במשימות מחקר או כתיבה כללית כדי לחסוך לך טוקנים."
      3. If the user wants to change code: 
         - Provide a BRIEF plan (max 2 sentences).
         - Return a hidden JSON block at the end: [[[{"id":1,"description":"...","affectedFiles":["..."]}]]]
         - Ask the user for confirmation.
      4. If it's just a question, answer briefly in Hebrew.
    `;

    const chat = model.startChat({
      history: history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.text }] })),
    });

    const result = await chat.sendMessage(systemInstruction + "\nUser Input: " + prompt);
    return result.response.text();
  }

  async editCode(currentCode, instructions) {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `Code:\n${currentCode}\nTask: ${instructions}\nReturn ONLY the new full code.`;
    const result = await model.generateContent(prompt);
    return result.response.text().replace(/```[a-z]*|```/g, "").trim();
  }
}

module.exports = AIService;
