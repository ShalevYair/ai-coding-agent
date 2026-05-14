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
- `updateProjectMap(...)` — מעדכן `project_map.json` אחרי כל execute

### Frontend — `client/src/`
```
App.js              — thin coordinator, settings state בלבד
hooks/
  useChat.js        — כל לוגיקת הצ'אט (messages, send, execute, preview, compress)
  useProjectData.js — README + project map
  useSavedChats.js  — שמירה וטעינה של שיחות
components/
  Header.jsx        — סרגל כלים, Tooltip wrapper לכל כפתור
  ChatWindow.jsx    — רשימת הודעות
  MessageBubble.jsx — הודעה בודדת (plan UI, ask UI, code blocks)
  ChatInput.jsx     — קלט + context file chips
  modals/           — SettingsModal, ReadmeModal, ProjectMapModal,
                      PreviewModal, SaveChatModal, LoadChatModal
utils/
  constants.js      — RESPONSE_LENGTHS, INITIAL_MESSAGE
  theme.js          — סגנונות inline משותפים
  formatMessage.jsx — עיצוב טקסט הודעות
  mapUtils.js       — עיבוד project_map.json
```

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
