import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, CheckCircle2 } from 'lucide-react';

const App = () => {
  const [aiKey, setAiKey] = useState(localStorage.getItem('ai-key') || '');
  const [githubToken, setGithubToken] = useState(localStorage.getItem('github-token') || '');
  const [owner, setOwner] = useState('');
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [prompt, setPrompt] = useState('בנה דף נחיתה פשוט');
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);

  useEffect(() => {
    if (githubToken) {
      axios.get('/api/user/repos', { headers: { 'x-github-token': githubToken, 'x-ai-key': aiKey } })
        .then(res => { setOwner(res.data.owner); setRepos(res.data.repos); setSelectedRepo(res.data.repos[0]); })
        .catch(() => {});
    }
  }, [githubToken, aiKey]);

  const generatePlan = async () => {
    setLoading(true); setPlan(null);
    try {
      const res = await axios.post('/api/plan', { prompt, owner, repo: selectedRepo }, 
      { headers: { 'x-ai-key': aiKey, 'x-github-token': githubToken } });
      setPlan(res.data.plan);
    } catch (err) { alert("שגיאה ביצירת תוכנית"); }
    setLoading(false);
  };

  const executeFullPlan = async () => {
    setExecuting(true);
    for (let i = 0; i < plan.length; i++) {
      setCurrentStep(i);
      try {
        await axios.post('/api/execute', {
          owner, repo: selectedRepo,
          filePath: plan[i].affectedFiles[0],
          instructions: plan[i].description
        }, { headers: { 'x-ai-key': aiKey, 'x-github-token': githubToken } });
      } catch (err) { alert(`נכשל בשלב ${i+1}`); break; }
    }
    setExecuting(false);
    setCurrentStep(plan.length);
    alert("הסוכן סיים!");
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '500px', margin: '0 auto', direction: 'rtl' }}>
      <h1>🤖 AI Agent</h1>
      <input type="password" placeholder="Gemini Key" value={aiKey} onChange={e => setAiKey(e.target.value)} style={{width:'95%', marginBottom:'10px'}} />
      <input type="password" placeholder="GitHub Token" value={githubToken} onChange={e => setGithubToken(e.target.value)} style={{width:'95%', marginBottom:'10px'}} />
      
      {owner && (
        <div style={{marginBottom:'10px'}}>
          <strong>פרויקט:</strong>
          <select value={selectedRepo} onChange={e => setSelectedRepo(e.target.value)}>
            {repos.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      )}

      <textarea value={prompt} onChange={e => setPrompt(e.target.value)} style={{width:'100%', height:'50px'}} />
      <button onClick={generatePlan} disabled={loading} style={{width:'100%', padding:'10px', background:'#2563eb', color:'white', border:'none', marginTop:'10px'}}>
        {loading ? <Loader2 className="animate-spin" /> : "צור תוכנית"}
      </button>

      {plan && (
        <div style={{marginTop:'20px', border:'1px solid #ddd', padding:'10px'}}>
          {plan.map((s, i) => (
            <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'5px', background: i === currentStep ? '#f0f9ff' : 'none'}}>
              <span>{s.description}</span>
              {i < currentStep ? <CheckCircle2 size={16} color="green" /> : i === currentStep && executing ? <Loader2 size={16} className="animate-spin" /> : null}
            </div>
          ))}
          <button onClick={executeFullPlan} disabled={executing} style={{width:'100%', marginTop:'10px', padding:'10px', background:'#10b981', color:'white', border:'none'}}>
            {executing ? "מבצע..." : "🚀 בצע הכל!"}
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
