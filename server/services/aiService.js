const { GoogleGenerativeAI } = require("@google/generative-ai");

class AIService {
  constructor(provider, apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    // משתמשים במודל Gemini 1.5 Flash - מהיר ומצוין למשימות קוד
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash" 
    });
  }

  async chat(prompt, history, context) {
    try {
      // 1. תיקון נתיב הקבצים - מוודא שאני מושך מכל מקום אפשרי ב-context
      const files = context?.realTimeFileList || context?.projectMap?.realTimeFileList || [];
      const fileListString = files.length > 0 ? files.join(', ') : "התיקייה ריקה כרגע.";

      // 2. עדכון הוראות מערכת - הוספתי את חוק 6 ועדכנתי את חוק 1
      const systemInstruction = `
        You are an AUTHORITATIVE AI CODING AGENT. 
        Your mission is to manage, develop, and update the GitHub repository for the user.

        CORE RULES:
        1. Base your answers on BOTH the file list AND any file content provided in the message.
        2. If 'project_map.json' or 'Gemini.md' are missing, your priority is to suggest creating them.
        3. Respond VERY BRIEFLY in Hebrew (1-2 sentences). Code stays in English.
        4. If you don't know something or information is missing, say it clearly.
        5. To create or modify files, provide a plan: [[[{"id":1,"description":"...","affectedFiles":["..."]}]]]
        6. You can see file contents if the server provides them in the 'USER MESSAGE' section.
      `;

      // 3. הזרקת הקונטקסט - השארנו את המבנה אבל עכשיו ה-AI מורשה לקרוא את ה-prompt המועשר
      const contextualizedPrompt = `
        REPOSITORY STRUCTURE: ${fileListString}
        ${prompt}
      `;

      const contents = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      contents.push({
        role: 'user',
        parts: [{ text: contextualizedPrompt }]
      });

      const result = await this.model.generateContent({
        contents: contents,
        systemInstruction: systemInstruction,
        generationConfig: {
          temperature: 0.1, // הורדתי עוד קצת כדי להיות הכי מדויק שיש
        }
      });

      const response = await result.response;
      return response.text();
    } catch (e) {
      console.error("AI Service Error:", e);
      throw new Error(`AI Service failed: ${e.message}`);
    }
  }

  
  // פונקציה לעריכת קוד (משמשת ב-execute)
  async editCode(currentContent, taskDescription) {
    try {
      const prompt = `
        TASK: ${taskDescription}
        EXISTING CODE:
        ${currentContent || "// New file - no existing content"}
        
        INSTRUCTION:
        Apply the changes requested. Return ONLY the full updated code. 
        No explanations, no markdown blocks. Just pure code.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      // ניקוי תגיות markdown אם ה-AI בטעות הוסיף אותן
      return response.text().replace(/```[a-z]*\n?|```/g, '').trim();
    } catch (e) {
      throw new Error(`Code editing failed: ${e.message}`);
    }
  }
}

module.exports = AIService;
