import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Loader2, PlayCircle, CheckCircle2, RefreshCw } from 'lucide-react';

const App = () => {
  const [aiKey, setAiKey] = useState(localStorage.getItem('ai-key') || '');
  const [githubToken, setGithubToken] = useState(localStorage.getItem('github-token') || '');
  const [owner, setOwner] = useState('');
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [prompt, setPrompt] = useState('בנה דף נחיתה פשוט עם כותרת וכפתור');
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingRepos, setFetchingRepos] = useState(false);
  const [executingId, setExecutingId] = useState(null);
  const [completedSteps, setCompletedSteps] = useState([]);

  // משיכת פרטי משתמש ורשימת פרויקטים
  const fetchGitHubData = async () => {
    if (!githubToken) return;
    setFetchingRepos(true);
    try {
      const res = await axios.get('/api/user/repos', {
        headers: { 'x-github-token': githubToken, 'x-ai-key': aiKey }
      });
      setOwner(res.data.owner);
      setRepos(res.data.repos);
      if (res.data.repos.length > 0 && !selectedRepo) setSelectedRepo(res.data.repos[0]);
    } catch (err) {
      console.error("שגיאה במשיכת נתונים");
    }
    setFetchingRepos(false);
  };

  useEffect(() => {
    localStorage.setItem('ai-key', aiKey);
    localStorage.setItem('github-token', githubToken);
    if (githubToken) fetchGitHubData();
  }, [githubToken, aiKey]);

  // יצירת תוכנית עבודה
  const generatePlan = async () => {
    setLoading(true);
    setPlan(null);
    setCompletedSteps([]);
    try {
      const res = await axios.post('/api/plan', {
        prompt, owner, repo: selectedRepo
      }, {
        headers: { 'x-ai-key': aiKey, 'x-github-token': githubToken }
      });
      setPlan(res.data.plan);
    } catch (err) {
      alert(`שגיאה: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };

  // ביצוע שלב (כתיבת קוד לגיטהאב)
  const executeStep = async (step) => {
    setExecutingId(step.id);
    try {
      await axios.post('/api/execute', {
        owner,
        repo: selectedRepo,
        filePath: step.affectedFiles[0],
        instructions: step.description
      }, {
        headers: { 'x-ai-key': aiKey, 'x-github-token': githubToken }
      });
      setCompletedSteps(prev => [...prev, step.id]);
    } catch (err) {
      alert(`שגיאה בביצוע: ${err.response?.data?.error || err.message}`);
    }
    setExecutingId(null);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto', direction: 'rtl' }}>
      <h1 style={{ textAlign: 'center', color: '#1e293b' }}>🤖 AI Coding Agent</h1>

      {/* הגדרות */}
      <section style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ marginTop: 0 }}><Settings size={18} /> חיבורים</h3>
        <input type="password" placeholder="Gemini API Key" value={aiKey} onChange={(e) => setAiKey(e.target.value)} style={{ width: '96%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
        <input type="password" placeholder="GitHub Token" value={githubToken} onChange={(e) => setGithubToken(e.target.value)} style={{ width: '96%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
      </section>

      {/* בחירת רפוזיטורי */}
      {owner && (
        <div style={{ marginBottom: '20px', padding: '15px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #dcfce7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>שלום {owner}!</strong> בחר פרויקט: 
            <select value={selectedRepo} onChange={(e) => setSelectedRepo(e.target.value)} style={{ marginLeft: '10px', padding: '5px', borderRadius: '4px' }}>
              {repos.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <button onClick={fetchGitHubData} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <RefreshCw size={20} className={fetchingRepos ? 'animate-spin' : ''} />
          </button>
        </div>
      )}

      {/* קלט AI */}
      <textarea 
        value={prompt} 
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="מה נבנה היום?"
        style={{ width: '100%', height: '80px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '10px', boxSizing: 'border-box' }}
      />
      
      <button 
        onClick={generatePlan} 
        disabled={loading || !selectedRepo}
        style={{ width: '100%', padding: '14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}
      >
        {loading ? <Loader2 className="animate-spin" style={{margin:'0 auto'}} /> : "הכן תוכנית עבודה 📋"}
      </button>

      {/* הצגת התוכנית עם כפתורי ביצוע */}
      {plan && (
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>📋 שלבי ביצוע:</h3>
          {plan.map(step => (
            <div key={step.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '10px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', color: '#334155' }}>{step.id}. {step.description}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>נתיב: {step.affectedFiles?.join(', ')}</div>
              </div>
              
              {completedSteps.includes(step.id) ? (
                <CheckCircle2 color="#10b981" size={28} />
              ) : (
                <button 
                  onClick={() => executeStep(step)} 
                  disabled={executingId !== null}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', transition: 'transform 0.2s' }}
                >
                  {executingId === step.id ? (
                    <Loader2 className="animate-spin" color="#2563eb" />
                  ) : (
                    <PlayCircle color="#2563eb" size={32} />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;
