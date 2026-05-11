const { Octokit } = require("@octokit/rest");

class GitHubService {
  constructor(token) {
    this.octokit = new Octokit({ auth: token });
  }

  async getFile(owner, repo, path) {
    try {
      const { data } = await this.octokit.rest.repos.getContent({ owner, repo, path });
      return Buffer.from(data.content, 'base64').toString();
    } catch (e) { return ""; }
  }

  async commitFile(owner, repo, path, content, message) {
    let sha;
    try {
      const { data } = await this.octokit.rest.repos.getContent({ owner, repo, path });
      sha = data.sha;
    } catch (e) { }

    return this.octokit.rest.repos.createOrUpdateFileContents({
      owner, repo, path, message,
      content: Buffer.from(content).toString('base64'),
      sha
    });
  }

  async getAiMap(owner, repo) {
    try {
      const { data } = await this.octokit.rest.repos.getContent({ owner, repo, path: "" });
      const files = Array.isArray(data) ? data.filter(f => f.type === 'file').map(f => f.path) : [];
      return { files };
    } catch (e) { return { files: [] }; }
  }
}

module.exports = GitHubService;
