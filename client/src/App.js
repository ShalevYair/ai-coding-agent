import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Loader2 } from 'lucide-react';

const App = () => {
  const [provider, setProvider] = useState(localStorage.getItem('ai-provider') || 'gemini');
  const [aiKey, setAiKey] = useState(localStorage.getItem('ai-key') || '');
  const [githubToken, setGithubToken] = useState(localStorage.getItem('github-token') || '');
  
  // פרטי הבדיקה שלך כבר כאן!
  const [repo, setRepo] = useState({ owner: 'shalevyair', name: 'ai-coding-agent' });
  const [prompt, setPrompt] = useState('בנה דף נחיתה פשוט עם כותרת וכפתור');
  
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('ai-provider', provider);
    localStorage.setItem('ai-key', aiKey);
    localStorage.setItem('github-token', githubToken);
  }, [provider, aiKey, githubToken]);

  const generatePlan = async () => {
    if (!aiKey || !githubToken) {
      alert("חובה להזין API Key ו-GitHub Token בהגדרות!");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('/api/plan', {
        prompt,
        owner: repo.owner,
        repo: repo.name
      }, {
        headers: {
          'x-ai-provider': provider,
          'x-ai-key': aiKey,
          'x-github-token': githubToken
        }
      });
      setPlan(res.data.plan);
    } catch (err) {
      alert(`שגיאה: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto', direction: 'rtl' }}>
      <h1>🤖 סוכן הקוד: מצב בדיקה</h1>

      <section style={{ background: '#fef2f2', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #fee2e2' }}>
        <h3><Settings size={18} /> הגדרות</h3>
        <div style={{ display: 'grid', gap: '10px' }}>
          <input type="password" placeholder="מפתח Gemini API Key" value={aiKey} onChange={(e) => setAiKey(e.target.value)} />
          <input type="password" placeholder="GitHub Token (ghp_...)" value={githubToken} onChange={(e) => setGithubToken(e.target.value)} />
        </div>
      </section>

      <section style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input placeholder="Owner" value={repo.owner} onChange={(e) => setRepo({...repo, owner: e.target.value})} />
          <input placeholder="Repo" value={repo.name} onChange={(e) => setRepo({...repo, name: e.target.value})} />
        </div>
        <textarea 
          placeholder="מה תרצה שהסוכן יבנה?" 
          value={prompt} 
          onChange={(e) => setPrompt(e.target.value)}
          style={{ width: '100%', height: '60px', marginBottom: '10px', padding: '10px' }}
        />
        <button 
          onClick={generatePlan} 
          disabled={loading}
          style={{ width: '100%', padding: '12px', cursor: 'pointer', background: '#2563eb', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}
        >
          {loading ? <Loader2 className="animate-spin" /> : "🚀 צור תוכנית עבודה (Gemini 2.5)"}
        </button>
      </section>

      {plan && (
        <section style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', background: '#f9fafb' }}>
          <h3>📋 שלבי הביצוע שה-AI הציע:</h3>
          {plan.map((step) => (
            <div key={step.id} style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
              <strong>{step.id}.</strong> {step.description}
            </div>
          ))}
        </section>
      )}
    </div>
  );
};

export default App;
