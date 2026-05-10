import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Play, CheckCircle, Loader2 } from 'lucide-react';

const App = () => {
  // מצבי הגדרות (נשמרים ב-LocalStorage)
  const [provider, setProvider] = useState(localStorage.getItem('ai-provider') || 'gemini');
  const [aiKey, setAiKey] = useState(localStorage.getItem('ai-key') || '');
  const [githubToken, setGithubToken] = useState(localStorage.getItem('github-token') || '');
  
  // מצבי עבודה
  const [repo, setRepo] = useState({ owner: '', name: '' });
  const [prompt, setPrompt] = useState('');
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  // שמירה אוטומטית של המפתחות כשהם משתנים
  useEffect(() => {
    localStorage.setItem('ai-provider', provider);
    localStorage.setItem('ai-key', aiKey);
    localStorage.setItem('github-token', githubToken);
  }, [provider, aiKey, githubToken]);

  const headers = {
    'x-ai-provider': provider,
    'x-ai-key': aiKey,
    'x-github-token': githubToken
  };

  const generatePlan = async () => {
    setLoading(true);
    try {
      // כאן התיקון: הסרנו את localhost
      const res = await axios.post('/api/plan', {
        prompt,
        owner: repo.owner,
        repo: repo.name
      }, { headers });
      setPlan(res.data.plan);
      setLogs(prev => [...prev, "Plan generated successfully."]);
    } catch (err) {
      alert("Error generating plan: " + err.message);
    }
    setLoading(false);
  };

  const executeStep = async (step) => {
    setLoading(true);
    setLogs(prev => [...prev, `Executing: ${step.description}...`]);
    try {
      // כאן התיקון: הסרנו את localhost
      await axios.post('/api/execute', {
        owner: repo.owner,
        repo: repo.name,
        filePath: step.affectedFiles[0],
        instructions: step.description
      }, { headers });
      setLogs(prev => [...prev, `Step completed: ${step.id}`]);
    } catch (err) {
      alert("Error executing step: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🤖 AI Coding Agent</h1>

      {/* Settings Section */}
      <section style={{ background: '#f4f4f4', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3><Settings size={18} /> Settings</h3>
        <div style={{ display: 'grid', gap: '10px' }}>
          <select value={provider} onChange={(e) => setProvider(e.target.value)}>
            <option value="gemini">Google Gemini</option>
            <option value="claude">Anthropic Claude</option>
          </select>
          <input type="password" placeholder="AI API Key" value={aiKey} onChange={(e) => setAiKey(e.target.value)} />
          <input type="password" placeholder="GitHub Personal Access Token" value={githubToken} onChange={(e) => setGithubToken(e.target.value)} />
        </div>
      </section>

      {/* Repo & Prompt */}
      <section style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input placeholder="Owner" value={repo.owner} onChange={(e) => setRepo({...repo, owner: e.target.value})} />
          <input placeholder="Repo Name" value={repo.name} onChange={(e) => setRepo({...repo, name: e.target.value})} />
        </div>
        <textarea 
          placeholder="What do you want to do?" 
          value={prompt} 
          onChange={(e) => setPrompt(e.target.value)}
          style={{ width: '100%', height: '80px', marginBottom: '10px' }}
        />
        <button onClick={generatePlan} disabled={loading || !prompt}>
          {loading ? <Loader2 className="animate-spin" /> : "Create Plan"}
        </button>
      </section>

      {/* Plan Display */}
      {plan && (
        <section style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
          <h3>Execution Plan</h3>
          {plan.map((step) => (
            <div key={step.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
              <span><strong>{step.id}:</strong> {step.description}</span>
              <button onClick={() => executeStep(step)} disabled={loading}><Play size={14} /></button>
            </div>
          ))}
        </section>
      )}

      {/* Logs */}
      <div style={{ marginTop: '20px', fontSize: '0.8em', color: '#666' }}>
        {logs.map((log, i) => <div key={i}><CheckCircle size={12} /> {log}</div>)}
      </div>
    </div>
  );
};

export default App;
