import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Loader2, PlayCircle, CheckCircle2, RefreshCw } from 'lucide-react';

const App = () => {
  const [aiKey, setAiKey] = useState(localStorage.getItem('ai-key') || '');
  const [githubToken, setGithubToken] = useState(localStorage.getItem('github-token') || '');
  const [owner, setOwner] = useState('');
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [prompt, setPrompt] = useState('בנה דף נחיתה פשוט');
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingRepos, setFetchingRepos] = useState(false);

  // פונקציה למשיכת המשתמש והרפוזיטוריז
  const fetchGitHubData = async () => {
    if (!githubToken) return;
    setFetchingRepos(true);
    try {
      const res = await axios.get('/api/user/repos', {
        headers: { 'x-github-token': githubToken, 'x-ai-key': aiKey }
      });
      setOwner(res.data.owner);
      setRepos(res.data.repos);
      if (res.data.repos.length > 0) setSelectedRepo(res.data.repos[0]);
    } catch (err) {
      console.error("שגיאה במשיכת רפוזיטוריז");
    }
    setFetchingRepos(false);
  };

  useEffect(() => {
    localStorage.setItem('ai-key', aiKey);
    localStorage.setItem('github-token', githubToken);
    if (githubToken) fetchGitHubData();
  }, [githubToken, aiKey]);

  const generatePlan = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/plan', {
        prompt, owner, repo: selectedRepo
      }, {
        headers: { 'x-ai-key': aiKey, 'x-github-token': githubToken }
      });
      setPlan(res.data.plan);
    } catch (err) { alert(err.message); }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto', direction: 'rtl' }}>
      <h1>🚀 AI Agent: Smart Connect</h1>

      <section style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
        <h3>🔑 הגדרות גישה</h3>
        <input type="password" placeholder="Gemini API Key" value={aiKey} onChange={(e) => setAiKey(e.target.value)} style={{width: '95%', marginBottom: '10px'}} />
        <input type="password" placeholder="GitHub Token" value={githubToken} onChange={(e) => setGithubToken(e.target.value)} style={{width: '95%'}} />
      </section>

      {owner && (
        <section style={{ marginBottom: '20px', padding: '15px', background: '#f0fdf4', borderRadius: '10px' }}>
          <div style={{ fontWeight: 'bold' }}>👤 מחובר כ: {owner}</div>
          <div style={{ marginTop: '10px' }}>
            <label>בחר פרויקט לעבודה: </label>
            <select 
              value={selectedRepo} 
              onChange={(e) => setSelectedRepo(e.target.value)}
              style={{ padding: '5px', borderRadius: '5px', marginRight: '10px' }}
            >
              {repos.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <button onClick={fetchGitHubData} style={{ background: 'none', border: 'none', cursor: 'pointer', verticalAlign: 'middle' }}>
              <RefreshCw size={16} className={fetchingRepos ? 'animate-spin' : ''} />
            </button>
          </div>
        </section>
      )}

      <textarea 
        value={prompt} 
        onChange={(e) => setPrompt(e.target.value)}
        style={{ width: '100%', height: '60px', marginBottom: '10px', padding: '10px' }}
      />
      
      <button 
        onClick={generatePlan} 
        disabled={loading || !selectedRepo}
        style={{ width: '100%', padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}
      >
        {loading ? <Loader2 className="animate-spin" /> : "צור תוכנית עבודה"}
      </button>

      {plan && (
        <div style={{ marginTop: '20px' }}>
          {plan.map(step => (
            <div key={step.id} style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
              <span>{step.description}</span>
              <PlayCircle color="#2563eb" style={{cursor:'pointer'}} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;
