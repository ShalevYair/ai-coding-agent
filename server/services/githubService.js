const { Octokit } = require('octokit');

class GitHubService {
  constructor(token) {
    this.octokit = new Octokit({ auth: token });
  }

  // שליפת תוכן של קובץ
  async getFile(owner, repo, path) {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
      });
      // GitHub מחזיר תוכן ב-Base64, אנחנו נפענח אותו לטקסט
      return Buffer.from(data.content, 'base64').toString('utf8');
    } catch (error) {
      if (error.status === 404) return null; // קובץ לא קיים
      throw error;
    }
  }

  // ביצוע Commit (יצירה או עדכון של קובץ)
  async commitFile(owner, repo, path, content, message, sha = null) {
    return await this.octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: Buffer.from(content).toString('base64'),
      sha, // נדרש אם אנחנו מעדכנים קובץ קיים
    });
  }

  // בדיקה אם קובץ ה-ai-map.json קיים ושליפתו
  async getAiMap(owner, repo) {
    const content = await this.getFile(owner, repo, 'ai-map.json');
    return content ? JSON.parse(content) : null;
  }
}

module.exports = GitHubService;