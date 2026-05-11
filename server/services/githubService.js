const { Octokit } = require("@octokit/rest");

class GitHubService {
  constructor(token) {
    this.octokit = new Octokit({ auth: token });
  }

  // שליפת תוכן קובץ (חיוני לעריכה)
  async getFile(owner, repo, path) {
    try {
      const { data } = await this.octokit.rest.repos.getContent({ owner, repo, path });
      return Buffer.from(data.content, 'base64').toString();
    } catch (e) { 
      return ""; // קובץ חדש
    }
  }

  // הפונקציה ש-index.js מחפש. כוללת טיפול ב-SHA (חובה לעדכון)
  async updateFile(owner, repo, path, content, message) {
    let sha;
    try {
      const { data } = await this.octokit.rest.repos.getContent({ owner, repo, path });
      sha = data.sha;
    } catch (e) { /* קובץ חדש, אין SHA */ }

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

  // סריקה רקוסיבית של כל התיקיות
  async getAiMap(owner, repo) {
    try {
      const { data } = await this.octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: 'main', 
        recursive: true
      });
      return data.tree.filter(f => f.type === 'blob').map(f => f.path);
    } catch (e) {
      console.error("Tree Error:", e.message);
      return [];
    }
  }
}

module.exports = GitHubService;
