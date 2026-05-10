const { Octokit } = require("@octokit/rest");

class GitHubService {
  constructor(token) {
    this.octokit = new Octokit({ auth: token });
    console.log("📂 GitHubService initialized");
  }

  async getAiMap(owner, repo) {
    console.log(`📂 GitHub: Fetching map for ${owner}/${repo}...`);
    try {
      // נסיון לקרוא קובץ בשם ai-map.json
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path: 'ai-map.json'
      });
      console.log("✅ GitHub: Found ai-map.json");
      return JSON.parse(Buffer.from(data.content, 'base64').toString());
    } catch (e) {
      console.log("⚠️ GitHub: ai-map.json not found, using empty map.");
      return { files: [] };
    }
  }
}

module.exports = GitHubService;
