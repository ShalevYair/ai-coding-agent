const { Octokit } = require("@octokit/rest");

class GitHubService {
  constructor(token) {
    this.octokit = new Octokit({ auth: token });
  }

  // שליפת תוכן קובץ
  async getFile(owner, repo, path) {
    try {
      const { data } = await this.octokit.rest.repos.getContent({ owner, repo, path });
      return Buffer.from(data.content, 'base64').toString();
    } catch (e) { 
      return ""; 
    }
  }

  // עדכון או יצירת קובץ - שיניתי את השם ל-updateFile כדי שיתאים ל-index.js
  async updateFile(owner, repo, path, content, message) {
    let sha;
    try {
      const { data } = await this.octokit.rest.repos.getContent({ owner, repo, path });
      sha = data.sha;
    } catch (e) { /* קובץ חדש */ }

    return this.octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: message || "AI Update",
      content: Buffer.from(content).toString('base64'),
      sha,
      branch: "main"
    });
  }

  // סריקה רקוסיבית של כל העץ - זה יאפשר ל-AI לראות את כל התיקיות
  async getAiMap(owner, repo) {
    try {
      // שימוש ב-Git Trees API עם recursive: true
      const { data } = await this.octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: 'main', // או ה-branch הדיפולטיבי שלך
        recursive: true
      });

      // מחזיר רק מערך של נתיבים (Strings) כפי שה-API מצפה
      return data.tree
        .filter(item => item.type === 'blob') // רק קבצים, לא תיקיות ריקות
        .map(item => item.path);
    } catch (e) {
      console.error("GitHub Tree Error:", e.message);
      return []; // החזרה של מערך ריק במקרה של שגיאה
    }
  }
}

module.exports = GitHubService;
