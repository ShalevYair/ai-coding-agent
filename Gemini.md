# AI Coding Agent — הקשר לסוכן AI

## מה הפרויקט?
סוכן פיתוח אוטונומי: ממשק צ'אט (React) המחובר ל-Gemini 2.5 Flash, שמאפשר לקרוא, ליצור ולעדכן קבצים ישירות בכל ריפוזיטורי GitHub של המשתמש — ללא עורך מקומי.

## ארכיטקטורה
- **Frontend**: React (CRA), כלל הלוגיקה ב-hooks מותאמים
- **Backend**: Express.js serverless על Vercel (`api/index.js`)
- **AI**: Google Gemini 2.5 Flash (`gemini-2.5-flash`)
- **Git**: Octokit (`@octokit/rest`) — קריאה וכתיבה ישירה ל-GitHub API
- **Auth**: header-based — `x-ai-key` (Gemini), `x-github-token` (GitHub)

## API Endpoints
| Method | Path | תיאור |
|--------|------|--------|
| GET | /api/github/user-data | שם משתמש ורשימת ריפוזיטוריות |
| GET | /api/file | קריאת קובץ מהריפו |
| POST | /api/chat | צ'אט עם הסוכן |
| POST | /api/execute | ביצוע תוכנית שינויים בגיט |
| POST | /api/preview | תצוגה מקדימה של שינויים (ללא commit) |
| POST | /api/compress | סיכום שיחה קצר עם AI |
| POST | /api/save-chat | שמירת שיחה ל-Saved_Chats.json בריפו |
| GET | /api/saved-chats | טעינת רשימת שיחות שמורות |

## פורמט תוכנית (Plan)
הסוכן מחזיר תוכנית בפורמט:
```
[[[
[{ "id": 1, "description": "...", "affectedFiles": ["path/to/file.js"] }]
]]]
```

## פורמט שאלה (ASK)
כשהסוכן לא בטוח באיזה קובץ לגעת:
```
[[[ASK]]]
{ "question": "...", "options": ["file1.js", "file2.js"] }
[[[/ASK]]]
```

## קבצים מיוחדים בריפו
- `project_map.json` — מיפוי אוטומטי של כל הקבצים (מתעדכן אחרי כל execute)
- `Saved_Chats.json` — שיחות שמורות של המשתמש (נוצר בעת שמירה ראשונה)
- `Gemini.md` — הקשר זה שאתה קורא עכשיו
- `CLAUDE.md` — מדריך פיתוח למפתחים

## הגדרות תצוגה
- גופן UI: Rubik (עברית/ערבית), JetBrains Mono (קוד)
- RTL בכל ממשק המשתמש
- גודל גופן: מתכוונן 11-20px
- אורך תשובה: קצר / רגיל / ארוך
