const { Octokit } = require("@octokit/rest");

class GitHubService {
  constructor(token) {
    this.octokit = new Octokit({ auth: token });
  }

  // קריאת תוכן קובץ
  async getFile(owner, repo, path) {
    try {
      const { data } = await this.octokit.rest.repos.getContent({ owner, repo, path });
      return Buffer.from(data.content, 'base64').toString();
    } catch (e) { return ""; }
  }

  // עדכון או יצירה (חייב להישאר בשם updateFile)
  async updateFile(owner, repo, path, content, message) {
    let sha;
    try {
      const { data } = await this.octokit.rest.repos.getContent({ owner, repo, path });
      sha = data.sha;
    } catch (e) { /* קובץ חדש */ }

    return this.octokit.rest.repos.createOrUpdateFileContents({
      owner, repo, path,
      message: message || "AI Update",
      content: Buffer.from(content).toString('base64'),
      sha,
      branch: "main"
    });
  }

  // סריקת כל הקבצים (חייב להחזיר מערך [])
  async getAiMap(owner, repo) {
    try {
      const { data } = await this.octokit.rest.git.getTree({
        owner, repo,
        tree_sha: 'main',
        recursive: true
      });
      return data.tree.filter(f => f.type === 'blob').map(f => f.path);
    } catch (e) { return []; }
  }

  // ביצוע תוכנית (עידכון קבצים לפי תוכנית)
  async executePlan(owner, repo, plan) {
    for (const item of plan) {
      const { path, message } = item;
      try {
        if (item.content) {
          // הפריט מכיל שדה 'content', נשתמש בו ישירות לעדכון הקובץ.
          // הפונקציה updateFile כבר מאחזרת את ה-SHA ומשתמשת ב-createOrUpdateFileContents.
          await this.updateFile(owner, repo, path, item.content, message);
        } else {
          // 'item.content' אינו קיים, נמשיך עם הלוגיקה הקיימת של יישום diff.
          // הלוגיקה הקיימת (בתוך שירות זה) עבור עדכון קובץ מצפה לתוכן הסופי.
          // אם נדרש יישום diff בפועל (לדוגמה, יישום patch),
          // יש לאחזר את התוכן הנוכחי, ליישם עליו את ה-diff (מכונה חיצונית/ספרייה),
          // ואז להעביר את התוכן החדש לפונקציה updateFile.
          // מאחר ואין כאן לוגיקת יישום diff מובנית, נשתמש בתוכן הקיים כברירת מחדל
          // ונוסיף אזהרה על כך.
          console.warn(`Item for path ${path} does not have 'content'. Diff logic is not explicitly implemented to apply patches within GitHubService. Fetching current content as fallback.`);
          const currentFileContent = await this.getFile(owner, repo, path);
          await this.updateFile(owner, repo, path, currentFileContent, message); // בפועל לא משנה את הקובץ אם לא יושם diff
        }
      } catch (error) {
        console.error(`Failed to process plan item for ${path} in ${owner}/${repo}:`, error.message);
        // ניתן לבחור אם להמשיך לפריט הבא או לזרוק את השגיאה
      }
    }
  }
}

module.exports = GitHubService;