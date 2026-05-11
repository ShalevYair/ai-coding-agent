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
}

module.exports = GitHubService;
