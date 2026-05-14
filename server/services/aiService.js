const { GoogleGenerativeAI } = require("@google/generative-ai");

class AIService {
  constructor(provider, apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
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

      const systemInstruction = `You are an AI CODING AGENT that manages a GitHub repository on behalf of the user.
You have DIRECT ACCESS to read, create, and modify files in the repository via the GitHub API.

ACTIVE REPOSITORY: ${context?.owner}/${context?.repo}
FILES CURRENTLY IN THE REPO: ${fileListString}

YOUR CAPABILITIES:
- Read any file in the repository (content is provided to you in context)
- Create new files by including them in a plan
- Modify existing files by including them in a plan
- All file changes are committed directly to GitHub — no local environment

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
    "description": "Precise instruction for the AI code writer. Describe exactly what to add, change, or create in this file.",
    "affectedFiles": ["path/to/file.js"]
  },
  {
    "id": 2,
    "description": "Another specific task description",
    "affectedFiles": ["path/to/other/file.js"]
  }
]
]]]

PLAN RULES:
- File paths MUST be relative to the repository root: e.g. "client/src/App.js", "api/index.js", "server/services/x.js"
- Each "description" is sent word-for-word to an AI code writer — be specific, unambiguous, and complete
- For new files: describe the entire content and purpose of the file
- For edits: describe exactly what to add, change, or remove — reference function names, variable names, etc.
- Do NOT include "project_map.json" in plans — it updates automatically after every execution
- Multiple files in one action only when they need the exact same change
- After providing the plan, the user must confirm before any code is executed

IF NO FILE CHANGES NEEDED: Just answer conversationally. No plan required.

═══════════════════════════════════════
WHEN YOU ARE UNSURE WHICH FILE TO EDIT:
═══════════════════════════════════════
If the user's request involves code changes but you cannot confidently determine WHICH FILE(S) to edit,
do NOT guess. Instead, ask the user by using this exact format:

[[[ASK]]]
{
  "question": "שאלה קצרה בעברית — למה אתה צריך הבהרה",
  "options": ["file/path/option1.js", "file/path/option2.js", "אחר (ציין בעצמך)"]
}
[[[/ASK]]]

WHEN TO USE ASK:
- The request is vague and could apply to multiple files (e.g., "שנה את הצבע" without specifying where)
- You see 2+ plausible files and genuinely don't know which one to edit
- A new feature could go in several reasonable locations

WHEN NOT TO USE ASK:
- The correct file is obvious from context or file name (e.g., "שנה את כותרת הדף" → clearly index.html or App.js)
- The user already specified a file name`;

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
}

module.exports = AIService;
