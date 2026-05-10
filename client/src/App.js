import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Play, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

const App = () => {
  const [provider, setProvider] = useState(localStorage.getItem('ai-provider') || 'gemini');
  const [aiKey, setAiKey] = useState(localStorage.getItem('ai-key') || '');
  const [githubToken, setGithubToken] = useState(localStorage.getItem('github-token') || '');
  const [repo, setRepo] = useState({ owner: '', name: '' });
  const [prompt, setPrompt] = useState('');
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    localStorage.setItem('ai-provider', provider);
    localStorage.setItem('ai-key', aiKey);
    localStorage.setItem('github-token', githubToken);
  }, [provider, aiKey, githubToken]);

  const validateFields = () => {
    if (!aiKey) { alert("חסר מפתח AI! נא להזין API Key בשדות ההגדרות."); return false; }
    if (!githubToken) { alert("חסר GitHub Token! בלעדיו לא נוכל לגשת לקבצים שלך."); return false; }
    if (!repo.owner || !repo.name) { alert("נא למלא את שם ה-Owner (שם המשתמש שלך) ואת שם ה-Repo בגיטהאב."); return false; }
    return true;
  };

  const generatePlan = async () => {
    if (!validateFields()) return;

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
      setLogs(prev => [...prev, "התוכנית נוצרה בהצלחה!"]);
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      alert(`שגיאה מהשרת: ${msg}\n\nטיפ: וודא שה-Token והמפתח תקינים.`);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto', direction: 'rtl' }}>
      <h1>🤖 סוכן הקוד שלי</h1>

      <section style={{ background: '#fef2f2', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #fee2e2' }}>
        <h3><Settings size={18} /> הגדרות (חובה)</h3>
        <div style={{ display: 'grid', gap: '10px' }}>
          <select value={provider} onChange={(e) => setProvider(e.target.value)}>
            <option value="gemini">Google Gemini</option>
            <option value="claude">Anthropic Claude</option>
          </select>
          <input type="password" placeholder="מפתח AI API Key" value={aiKey} onChange={(e) => setAiKey(e.target.value)} />
          <input type="password" placeholder="GitHub Personal Access Token" value={githubToken} onChange={(e) => setGithubToken(e.target.value)} />
        </div>
      </section>

      <section style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input placeholder="שם משתמש (Owner)" value={repo.owner} onChange={(e) => setRepo({...repo, owner: e.target.value})} />
          <input placeholder="שם הפרויקט (Repo)" value={repo.name} onChange={(e) => setRepo({...repo, name: e.target.value})} />
        </div>
        <textarea 
          placeholder="מה תרצה לבנות?" 
          value={prompt} 
          onChange={(e) => setPrompt(e.target.value)}
          style={{ width: '100%', height: '80px', marginBottom: '10px', padding: '10px' }}
        />
        <button 
          onClick={generatePlan} 
          disabled={loading}
          style={{ padding: '10px 20px', cursor: 'pointer', background: '#2563eb', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          {loading ? <Loader2 className="animate-spin" /> : "צור תוכנית עבודה"}
        </button>
      </section>

      {plan && (
        <section style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
          <h3>שלבי הביצוע:</h3>
          {plan.map((step) => (
            <div key={step.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
              <span><strong>{step.id}:</strong> {step.description}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
};

export default App;
