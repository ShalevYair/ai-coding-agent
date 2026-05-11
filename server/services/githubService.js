// server/services/githubService.js
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

  // תיקון השם ל-updateFile כדי שיתאים לקריאה ב-api/index.js
  async updateFile(owner, repo, path, content, message) {
    let sha;
    try {
      const { data } = await this.octokit.rest.repos.getContent({ owner, repo, path });
      sha = data.sha;
    } catch (e) { /* קובץ חדש - אין SHA */ }

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

  // שליפת עץ הקבצים המלא (Recursive)
  async getAiMap(owner, repo) {
    try {
      const { data } = await this.octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: 'main', 
        recursive: true
      });

      // מחזיר מערך פשוט של נתיבים (Strings)
      return data.tree
        .filter(item => item.type === 'blob')
        .map(item => item.path);
    } catch (e) {
      console.error("GitHub Tree Error:", e.message);
      return []; 
    }
  }
}

module.exports = GitHubService;
