# AI Coding Agent — הקשר לסוכן AI

## מה הפרויקט?
סוכן פיתוח אוטונומי: ממשק צ'אט (React) המחובר ל-Gemini 3 Flash Preview, שמאפשר לקרוא, ליצור ולעדכן קבצים ישירות בכל ריפוזיטורי GitHub של המשתמש — ללא עורך מקומי. הסוכן עובד במחזור פיתוח מלא: תכנון → ביצוע → העלאה לגיט → אימות → תיקון.

## מודלים
- **ברירת מחדל (כל השיחות, עריכת קוד)**: `gemini-3-flash-preview`
- **סריקה עמוקה (כפתור S)**: `gemini-2.5-flash-lite` — קורא את כל קבצי הפרויקט ועונה תשובה ודאית
- **רענון מפת פרויקט**: `gemini-2.5-flash-lite` — מייצר תיאורים לכל קובץ

## ארכיטקטורה
- **Frontend**: React (CRA), כלל הלוגיקה ב-hooks מותאמים
- **Backend**: Express.js serverless על Vercel (`api/index.js`)
- **AI**: Google Gemini 3 Flash Preview (`gemini-3-flash-preview`)
- **Git**: Octokit (`@octokit/rest`) — קריאה וכתיבה ישירה ל-GitHub API
- **Auth**: header-based — `x-ai-key` (Gemini), `x-github-token` (GitHub)

## API Endpoints
| Method | Path | תיאור |
|--------|------|--------|
| GET | /api/github/user-data | שם משתמש ורשימת ריפוזיטוריות |
| GET | /api/file | קריאת קובץ מהריפו |
| POST | /api/chat | צ'אט עם הסוכן (תומך ב-deepScan flag) |
| POST | /api/execute | ביצוע תוכנית שינויים בגיט (מחזיר snapshot לundo) |
| POST | /api/undo | שחזור קבצים לגרסה לפני הביצוע האחרון |
| POST | /api/preview | תצוגה מקדימה של שינויים (ללא commit) |
| POST | /api/compress | סיכום שיחה קצר עם AI |
| POST | /api/save-chat | שמירת שיחה ל-Saved_Chats.json בריפו |
| GET | /api/saved-chats | טעינת רשימת שיחות שמורות |
| POST | /api/scan-project | סריקת כל הקבצים ועדכון project_map.json (Flash-Lite) |
| POST | /api/create-gemini-md | ניתוח הפרויקט ויצירת Gemini.md (Flash-Lite) |
| POST | /api/refine-prompt | שיפור פרומט למשתמש (מצבי raven/owl) |

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

## תכונות ממשק
| כפתור | תיאור |
|-------|--------|
| `↩️` Undo | שחזור הגרסה הקודמת מגיטהאב (פעיל לאחר ביצוע) |
| `3/5/1` ניסיונות | מספר ניסיונות חוזרים אוטומטיים אם העלאה נכשלה |
| `S` סריקה עמוקה | קריאת כל קבצי הפרויקט לתשובה ודאית (Flash-Lite, חד-פעמי) |
| `🔄` רענן מפה | רענון project_map.json דרך GitHub עם Flash-Lite |
| `🕊️/🐦/🦉` מצב בינה | dove=ישיר, raven=כפול, owl=משולש |
| `🐱/🐘/🐟` זיכרון | מספר הודעות בהיסטוריה |

## קבצים מיוחדים בריפו
- `project_map.json` — מיפוי אוטומטי של כל הקבצים (מתעדכן אחרי כל execute)
- `Saved_Chats.json` — שיחות שמורות של המשתמש (נוצר בעת שמירה ראשונה)
- `Gemini.md` — הקשר זה שאתה קורא עכשיו
- `CLAUDE.md` — מדריך פיתוח למפתחים

## הגדרות תצוגה
- גופן UI: Rubik (עברית/ערבית), JetBrains Mono (קוד)
- RTL בכל ממשק המשתמש, LTR לתצוגת קוד
- גודל גופן: מתכוונן 11-20px
- אורך תשובה: קצר / רגיל / ארוך
