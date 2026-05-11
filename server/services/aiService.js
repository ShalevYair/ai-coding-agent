const { GoogleGenerativeAI } = require("@google/generative-ai");

class AIService {
  constructor(provider, apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    // משתמשים במודל Gemini 1.5 Flash - מהיר ומצוין למשימות קוד
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash" 
    });
  }

  async chat(prompt, history, context) {
    try {
      // 1. חילוץ רשימת הקבצים והפיכתה לטקסט קריא עבור ה-AI
      const files = context?.projectMap?.realTimeFileList || [];
      const fileListString = files.length > 0 ? files.join(', ') : "התיקייה ריקה כרגע.";

      // 2. הגדרת זהות הסוכן (System Instruction)
      const systemInstruction = `
        You are an AUTHORITATIVE AI CODING AGENT. 
        Your mission is to manage, develop, and update the GitHub repository for the user.

        CORE RULES:
        1. Always speak the truth based ONLY on the provided file list.
        2. If 'project_map.json' or 'README.md' are missing, your priority is to suggest creating them.
        3. Respond VERY BRIEFLY in Hebrew (1-2 sentences). Code stays in English.
        4. If you don't know something or the list is empty, say it clearly.
        5. To create or modify files, you MUST provide a plan in this exact format:
           [[[{"id":1,"description":"Brief task description","affectedFiles":["path/to/file"]}]]]
      `;

      // 3. הזרקת הקונטקסט (רשימת הקבצים) ישירות לתוך הפרומפט של המשתמש
      // זה מבטיח שה-AI "רואה" את הקבצים בכל הודעה מחדש
      const contextualizedPrompt = `
        CURRENT REPOSITORY FILES: ${fileListString}
        USER MESSAGE: ${prompt}
      `;

      // 4. הכנת ההיסטוריה לפורמט של Google Gemini
      // ה-history מגיע מה-Frontend כמערך של {role, text}
      const contents = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      // הוספת ההודעה הנוכחית עם הקונטקסט
      contents.push({
        role: 'user',
        parts: [{ text: contextualizedPrompt }]
      });

      // 5. קריאה ל-API
      const result = await this.model.generateContent({
        contents: contents,
        systemInstruction: systemInstruction,
        generationConfig: {
          temperature: 0.2, // טמפרטורה נמוכה כדי למנוע הזיות
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
