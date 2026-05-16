# CLAUDE.md — מדריך פיתוח ל-Claude Code

## הרצה מקומית
```bash
npm run dev          # מריץ client (port 3000) + server (port 3001) במקביל
npm run client       # רק React
npm run server       # רק Express
```

## ארכיטקטורת הקוד

### Backend — `api/index.js`
Express app יחיד ב-Vercel serverless. כל ה-routes בקובץ אחד.
- `getServices(req)` — יוצר AIService + GitHubService מה-headers
- `compressHistory(history)` — מקצץ היסטוריה לפני שליחה ל-AI (8 הודעות, 800 תווים)
- `updateProjectMap(...)` — מעדכן `project_map.json` אחרי כל execute, מחזיר את האובייקט

### מודלים
- **ברירת מחדל**: `gemini-3-flash-preview` — כל השיחות, עריכת קוד, תיאורים
- **סריקה עמוקה (S)**: `gemini-2.5-flash-lite` — `/api/chat` עם `deepScan: true`
- **רענון מפה**: `gemini-2.5-flash-lite` — `/api/scan-project`
- `AIService(provider, apiKey, modelName?)` — model name ניתן לשינוי דרך ה-constructor

### API Endpoints חשובים
| Route | תיאור |
|-------|--------|
| POST /api/chat | צ'אט; תומך ב-`deepScan: boolean` |
| POST /api/execute | מחזיר `snapshot` לundo |
| POST /api/undo | משחזר קבצים מ-snapshot |
| POST /api/scan-project | סריקת כל הקבצים, עדכון project_map.json (Flash-Lite) |
| POST /api/create-gemini-md | ניתוח פרויקט ויצירת Gemini.md |

### Frontend — `client/src/`
```
App.js              — thin coordinator, settings state בלבד
hooks/
  useChat.js        — כל לוגיקת הצ'אט (messages, send, execute, preview, compress,
                      undo stack, deepScanMode, retry logic, missing-files check)
  useProjectData.js — README + project map + refreshProjectMap
  useSavedChats.js  — שמירה וטעינה של שיחות
components/
  SideMenu.jsx      — תפריט צד עם כל כפתורי השליטה
  ChatWindow.jsx    — רשימת הודעות
  MessageBubble.jsx — הודעה בודדת (plan UI, ask UI, code blocks)
  ChatInput.jsx     — קלט + context file chips
  modals/           — SettingsModal, ReadmeModal, ProjectMapModal (+ כפתור רענון),
                      PreviewModal, SaveChatModal, LoadChatModal
utils/
  constants.js      — RESPONSE_LENGTHS, AGENT_MODES, MEMORY_MODES, MAX_RETRIES_CYCLE
  theme.js          — סגנונות inline משותפים
  formatMessage.jsx — עיצוב טקסט הודעות
  mapUtils.js       — עיבוד project_map.json
```

### תכונות מיוחדות ב-useChat
- **undoStack**: שמירת snapshots לפני כל execute — כפתור ↩️
- **maxRetries**: ניסיונות חוזרים אוטומטיים (1/3/5) עם exponential backoff
- **deepScanMode**: מצב S — קורא כל קבצי הפרויקט, auto-reset אחרי שליחה
- **checkMissingFiles**: בדיקת project_map.json + Gemini.md בתחילת שיחה (פעם אחת לריפו)

## פורמטים חשובים

### Plan format (AI → Frontend)
```
[[[
[{ "id": 1, "description": "...", "affectedFiles": ["path/file.js"] }]
]]]
```

### ASK format (AI → Frontend)
```
[[[ASK]]]
{ "question": "...", "options": ["option1", "option2"] }
[[[/ASK]]]
```
ASK תומך בשדה `_action` פנימי לטיפול בפעולות מיוחדות (scan-project, create-gemini-md).

### Saved_Chats.json
```json
[{
  "id": "timestamp",
  "title": "כותרת בעברית שנוצרה על ידי AI",
  "date": "2026-05-14",
  "type": "full" | "summary",
  "messageCount": 15,
  "content": [...messages] | "summary text"
}]
```

## כללי קוד
- **שפה**: UI ו-comments בעברית, קוד באנגלית
- **כיוון**: `dir="rtl"` בכל ממשק המשתמש, `dir="ltr"` לתצוגת קוד
- **סגנון**: inline styles בלבד (אין CSS modules, אין Tailwind)
- **Auth**: headers בלבד — אין JWT, אין session — ה-AI key ו-GitHub token עוברים בכל בקשה
- **Rate limiting**: in-memory (serverless limitation) — 30/min chat, 10/min execute
- **project_map.json**: פורמט flat `{ "files": { "path": "description" } }` — מתעדכן אוטומטית

## deployment
Vercel — `vercel.json` מנתב `/api/*` לשרת ה-Express, כל השאר ל-React build.
