const { GoogleGenerativeAI } = require("@google/generative-ai");

class AIService {
  constructor(provider, apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
  }

  async chat(prompt, history, context, responseLength = 'short') {
    try {
      const files = context?.realTimeFileList || [];
      const fileListString = files.length > 0 ? files.join(', ') : "הריפו ריק כרגע.";

      const lengthGuide = {
        short:  'ענה ב-1-2 משפטים קצרים בלבד. תמציתי ביותר.',
        normal: 'ענה בצורה ממוקדת וברורה, 3-5 משפטים.',
        long:   'ענה בצורה מפורטת ומקיפה עם הסברים מלאים ככל הנדרש.'
      }[responseLength] || 'ענה ב-1-2 משפטים.';

      const systemInstruction = `You are an AI CODING AGENT — the equivalent of Claude Code — operating in a full development cycle on a live GitHub repository.
You work DIRECTLY on GitHub files via the API. There is no local machine, no terminal, no npm/build step you can run. Every plan you produce becomes a GitHub commit.

ACTIVE REPOSITORY: ${context?.owner}/${context?.repo}
FILES CURRENTLY IN THE REPO: ${fileListString}

═══════════════════════════════════════
YOUR DEVELOPMENT CYCLE:
═══════════════════════════════════════
1. UNDERSTAND — Read the user's request. Relevant file contents are injected into your context automatically.
2. PLAN — Design a precise implementation: which files to create or edit, and exactly what changes to make.
3. EXECUTE — Your plan is sent to an AI code-writer and each step is committed to GitHub.
4. VERIFY — After execution the user sees the result. If something looks wrong, produce a corrected plan.
5. FIX — The system supports automatic retries (up to the user's configured limit) if a push fails.

IMPORTANT CONSTRAINTS:
- You CANNOT run code, execute tests, or check build errors — only read and write files
- When editing, always describe changes relative to the existing code (add after X, replace Y with Z, remove function Z)
- Prefer small focused changes over full rewrites unless a rewrite is explicitly requested
- If you need to read a file that isn't in context, ask the user to pin it as a context file

YOUR CAPABILITIES:
- Read any file (content provided in context when mentioned or pinned)
- Create new files by including them in a plan
- Modify existing files by including them in a plan
- Chain multiple related changes into one multi-step plan

RESPONSE LANGUAGE: Always respond in Hebrew (unless the user writes in another language). Code stays in English.
RESPONSE LENGTH: ${lengthGuide}

═══════════════════════════════════════
WHEN THE USER WANTS TO CHANGE THE CODE:
═══════════════════════════════════════
You MUST provide a structured plan using EXACTLY this format (triple brackets [[[...]]]):

[[[
[
  {
    "id": 1,
    "description": "Precise instruction for the AI code writer. Must be SELF-CONTAINED: include the function name to modify, exact strings to add/remove, and enough surrounding context to locate the change unambiguously.",
    "affectedFiles": ["path/to/file.js"]
  },
  {
    "id": 2,
    "description": "Another specific task — each step goes to a separate AI writer, so it must stand alone.",
    "affectedFiles": ["path/to/other/file.js"]
  }
]
]]]

PLAN RULES:
- File paths MUST be relative to the repo root: e.g. "client/src/App.js", "api/index.js", "server/services/x.js"
- Each "description" is passed verbatim to a separate AI code writer — make it specific, unambiguous, and complete
- For new files: describe the full structure, exports, and purpose of the file
- For edits: state exactly what to add, change, or remove — include function names, variable names, and line context
- Do NOT include "project_map.json" — it updates automatically after every execution
- One file per plan step (unless multiple files need the exact same identical change)
- The user must confirm the plan before any code is executed

IF NO FILE CHANGES NEEDED: Just answer conversationally. No plan format required.

═══════════════════════════════════════
WHEN YOU ARE UNSURE WHICH FILE TO EDIT:
═══════════════════════════════════════
If the request involves code changes but you cannot confidently identify which file(s) to edit, do NOT guess.
Ask using this exact format:

[[[ASK]]]
{
  "question": "שאלה קצרה בעברית — מה צריך הבהרה",
  "options": ["file/path/option1.js", "file/path/option2.js", "אחר (ציין בעצמך)"]
}
[[[/ASK]]]

USE ASK WHEN:
- The request is vague and could apply to multiple files ("שנה את הצבע" — where exactly?)
- You see 2+ equally plausible files and genuinely cannot choose
- A new feature has several reasonable homes in the codebase

DO NOT USE ASK WHEN:
- The correct file is obvious from context or naming ("שנה את כותרת הדף" → App.js or index.html)
- The user already named the file
- You can make a confident inference from the project structure`;

      const contents = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      contents.push({
        role: 'user',
        parts: [{ text: prompt }]
      });

      const result = await this.model.generateContent({
        contents,
        systemInstruction,
        generationConfig: { temperature: 0.1 }
      });

      return result.response.text();
    } catch (e) {
      console.error("AI Service Error:", e);
      throw new Error(`AI Service failed: ${e.message}`);
    }
  }

  async editCode(currentContent, taskDescription) {
    try {
      const prompt = `TASK: ${taskDescription}

EXISTING FILE CONTENT:
${currentContent || "// New file — no existing content"}

INSTRUCTION:
Apply the requested changes to the file.
Return ONLY the complete updated file content — no explanations, no markdown code fences, no comments about what changed.
Just the raw code/text exactly as it should be saved to disk.`;

      const result = await this.model.generateContent(prompt);
      return result.response.text().replace(/```[a-z]*\n?|```/g, '').trim();
    } catch (e) {
      throw new Error(`Code editing failed: ${e.message}`);
    }
  }

  async summarizeConversation(convoText) {
    try {
      const prompt = `להלן שיחה בין משתמש לסוכן AI לכתיבת קוד. סכם אותה בעברית בצורה קצרה וממוקדת (3-6 משפטים) — מה נדון, אילו שינויים בוצעו, ומה הוחלט. החזר רק את הסיכום, ללא כותרות.

${convoText}`;
      const result = await this.model.generateContent(prompt);
      return result.response.text().trim();
    } catch (e) {
      throw new Error(`Summarize failed: ${e.message}`);
    }
  }

  async generateTitle(convoText) {
    try {
      const prompt = `בהתבסס על השיחה הבאה, צור כותרת קצרה בעברית (3-6 מילים) שמתארת את נושא השיחה. החזר רק את הכותרת, ללא פיסוק מיוחד.

${convoText.substring(0, 2000)}`;
      const result = await this.model.generateContent(prompt);
      return result.response.text().trim();
    } catch (e) {
      return 'שיחה שמורה';
    }
  }

  async refinePrompt(prompt, context) {
    try {
      const repo = context?.repo || '';
      const instruction = `You are a prompt-engineering assistant for an AI coding agent working on the repository "${repo}".
The user wrote the following request. Rewrite it into a clearer, more specific, and more actionable prompt for a coding agent.
Keep the same intent and language (Hebrew if the user wrote in Hebrew). Return ONLY the improved prompt text — no explanations, no labels.

Original prompt:
${prompt}`;
      const result = await this.model.generateContent(instruction);
      return result.response.text().trim();
    } catch (e) {
      return prompt;
    }
  }

  async describeFile(filePath, content) {
    try {
      const prompt = `File path: ${filePath}
File content (first 1500 chars):
${content.substring(0, 1500)}

Write a concise Hebrew description (1-2 sentences) explaining what this file does and its role in the project.
Return ONLY the description text, nothing else.`;
      const result = await this.model.generateContent(prompt);
      return result.response.text().trim();
    } catch (e) {
      return '';
    }
  }

  async generateGeminiMd(repoName, fileList, keyFilesContent) {
    try {
      const prompt = `You are analyzing a GitHub repository named "${repoName}".
Based on the file list and key file contents below, create a comprehensive Gemini.md file.
This file is the AI coding agent's guide to understanding the codebase — it is loaded into context on every request.

FILE LIST:
${fileList.join('\n')}

KEY FILE CONTENTS:
${keyFilesContent}

Write the Gemini.md file with the following sections:
# ${repoName} — מדריך לסוכן AI

## תיאור הפרויקט
(מה הפרויקט עושה, מטרתו, קהל היעד)

## טכנולוגיות
(שפות, frameworks, ספריות עיקריות)

## ארכיטקטורה
(תיאור מבנה הספריות והקבצים הראשיים)

## קבצים חשובים
(לכל קובץ משמעותי — נתיב + תפקיד)

## כללי פיתוח
(דפוסי קוד, מוסכמות, דברים שחשוב לדעת לפני עריכה)

Write in Hebrew. Keep code, file paths and technical terms in English. Be specific and practical — this is read by an AI, not a human.`;
      const result = await this.model.generateContent(prompt);
      return result.response.text().trim();
    } catch (e) {
      throw new Error(`generateGeminiMd failed: ${e.message}`);
    }
  }
}

module.exports = AIService;
