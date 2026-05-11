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
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);

  // משיכת נתונים מגיטהאב בכניסה
  useEffect(() => {
    if (githubToken) {
      axios.get('/api/user/repos', { headers: { 'x-github-token': githubToken, 'x-ai-key': aiKey } })
        .then(res => { setOwner(res.data.owner); setRepos(res.data.repos); setSelectedRepo(res.data.repos[0]); });
    }
  }, [githubToken, aiKey]);

  const generatePlan = async () => {
    setLoading(true); setPlan(null); setCurrentStepIndex(-1);
    try {
      const res = await axios.post('/api/plan', { prompt, owner, repo: selectedRepo }, 
      { headers: { 'x-ai-key': aiKey, 'x-github-token': githubToken } });
      setPlan(res.data.plan);
    } catch (err) { alert("שגיאה ביצירת תוכנית"); }
    setLoading(false);
  };

  // פונקציית הקסם - מריצה את כל השלבים אחד אחרי השני
  const executeFullPlan = async () => {
    setExecuting(true);
    for (let i = 0; i < plan.length; i++) {
      setCurrentStepIndex(i);
      try {
        await axios.post('/api/execute', {
          owner, repo: selectedRepo,
          filePath: plan[i].affectedFiles[0],
          instructions: plan[i].description
        }, { headers: { 'x-ai-key': aiKey, 'x-github-token': githubToken } });
      } catch (err) {
        alert(`שגיאה בשלב ${i+1}`);
        break;
      }
    }
    setExecuting(false);
    alert("הסוכן סיים לבנות הכל! בדוק את גיטהאב.");
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto', direction: 'rtl' }}>
      <h1>🤖 AI Coding Agent</h1>
      
      <div style={{ background: '#f1f5f9', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
        <input type="password" placeholder="Gemini Key" value={aiKey} onChange={e => setAiKey(e.target.value)} style={{width:'94%', marginBottom:'10px'}} />
        <input type="password" placeholder="GitHub Token" value={githubToken} onChange={e => setGithubToken(e.target.value)} style={{width:'94%'}} />
      </div>

      {owner && (
        <div style={{ marginBottom: '20px' }}>
          <strong>פרויקט:</strong>
          <select value={selectedRepo} onChange={e => setSelectedRepo(e.target.value)} style={{marginRight:'10px'}}>
            {repos.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      )}

      <textarea value={prompt} onChange={e => setPrompt(e.target.value)} style={{width:'100%', height:'60px', marginBottom:'10px'}} />
      
      <button onClick={generatePlan} disabled={loading || executing} style={{width:'100%', padding:'12px', background:'#2563eb', color:'white', border:'none', borderRadius:'5px'}}>
        {loading ? <Loader2 className="animate-spin" /> : "צור תוכנית עבודה"}
      </button>

      {plan && (
        <div style={{ marginTop: '20px', border: '1px solid #ddd', padding: '15px', borderRadius: '10px' }}>
          <h3>📋 שלבים:</h3>
          {plan.map((step, index) => (
            <div key={index} style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', background: index === currentStepIndex ? '#e0f2fe' : 'transparent' }}>
              <span>{step.id}. {step.description}</span>
              {index < currentStepIndex || (index === currentStepIndex && !executing) ? <CheckCircle2 color="green" /> : null}
              {index === currentStepIndex && executing && <Loader2 className="animate-spin" />}
            </div>
          ))}

          <button 
            onClick={executeFullPlan} 
            disabled={executing}
            style={{ width: '100%', marginTop: '20px', padding: '15px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {executing ? "הסוכן עובד... 🔨" : "🚀 בצע את כל התוכנית בגיטהאב!"}
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
