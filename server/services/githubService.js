const { Octokit } = require("@octokit/rest");

class GitHubService {
  constructor(token) {
    this.octokit = new Octokit({ auth: token });
  }

  // משיכת תוכן של קובץ קיים
  async getFile(owner, repo, path) {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner, repo, path
      });
      return Buffer.from(data.content, 'base64').toString();
    } catch (e) {
      return ""; // אם הקובץ לא קיים, נחזיר טקסט ריק
    }
  }

  // כתיבת קוד לקובץ (חדש או קיים)
  async commitFile(owner, repo, path, content, message) {
    let sha;
    try {
      const { data } = await this.octokit.rest.repos.getContent({ owner, repo, path });
      sha = data.sha;
    } catch (e) { /* קובץ חדש */ }

    return this.octokit.rest.repos.createOrUpdateFileContents({
      owner, repo, path, message,
      content: Buffer.from(content).toString('base64'),
      sha
    });
  }

  // יצירת "מפה" של כל הקבצים בפרויקט כדי שה-AI יכיר אותם
  async getAiMap(owner, repo) {
    const { data } = await this.octokit.rest.repos.getContent({ owner, repo, path: "" });
    const files = data.filter(f => f.type === 'file').map(f => f.path);
    return { files };
  }
}

module.exports = GitHubService;
