import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, CheckCircle2, Settings, RefreshCw, FileText, BrainCircuit, Rocket } from 'lucide-react';

const App = () => {
  // --- State Management ---
  const [aiKey, setAiKey] = useState(localStorage.getItem('ai-key') || '');
  const [githubToken, setGithubToken] = useState(localStorage.getItem('github-token') || '');
  const [owner, setOwner] = useState('');
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [readme, setReadme] = useState('');
  const [projectMap, setProjectMap] = useState(null);
  const [prompt, setPrompt] = useState('הוסף עיצוב CSS מודרני לדף הבית');
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1); // -1: idle, 0+: steps, -2: finalizing

  const headers = { 'x-github-token': githubToken, 'x-ai-key': aiKey };

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('ai-key', aiKey);
    localStorage.setItem('github-token', githubToken);
    if (githubToken && githubToken.startsWith('ghp_')) fetchRepos();
  }, [githubToken, aiKey]);

  useEffect(() => {
    if (selectedRepo && owner) fetchContext();
  }, [selectedRepo, owner]);

  // --- API Calls ---
  const fetchRepos = async () => {
    try {
      const res = await axios.get('/api/user/repos', { headers });
      setOwner(res.data.owner);
      setRepos(res.data.repos);
      if (res.data.repos.length > 0 && !selectedRepo) setSelectedRepo(res.data.repos[0]);
    } catch (e) { console.error("GitHub Auth Error"); }
  };

  const fetchContext = async () => {
    try {
      const res = await axios.get(`/api/repo/context?owner=${owner}&repo=${selectedRepo}`, { headers });
      setReadme(res.data.readme || 'אין README.md עדיין');
      setProjectMap(res.data.projectMap);
    } catch (e) { setReadme('לא ניתן לטעון הקשר'); }
  };

  const generatePlan = async () => {
    if (!selectedRepo) return alert("בחר רפוזיטורי תחילה");
    setLoading(true);
    setPlan(null);
    try {
      const res = await axios.post('/api/plan', { 
        prompt, owner, repo: selectedRepo, context: { readme, projectMap } 
      }, { headers });
      setPlan(res.data.plan);
    } catch (e) { alert("שגיאה ביצירת תוכנית: " + (e.response?.data?.error || e.message)); }
    setLoading(false);
  };

  const executeFullPlan = async () => {
    setExecuting(true);
    try {
      // ביצוע השלבים
      for (let i = 0; i < plan.length; i++) {
        setCurrentStep(i);
        await axios.post('/api/execute', {
          owner, repo: selectedRepo,
          filePath: plan[i].affectedFiles[0],
          instructions: plan[i].description
        }, { headers });
      }

      // שלב הסיום - עדכון המפה וה-README
      setCurrentStep(-2); 
      await axios.post('/api/repo/finalize', { owner, repo: selectedRepo, prompt }, { headers });
      
      alert("✅ המשימה הושלמה! ה-README והמפה עודכנו.");
      fetchContext(); // רענון הנתונים
    } catch (e) {
      alert("❌ נכשל בשלב " + (currentStep + 1));
    }
    setExecuting(false);
    setCurrentStep(-1);
  };

  // --- UI ---
  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui', maxWidth: '700px', margin: '0 auto', direction: 'rtl', color: '#1e293b' }}>
      <h1 style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
        <BrainCircuit color="#2563eb" /> AI Coding Agent
      </h1>

      {/* הגדרות מפתחות */}
      <section style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '5px' }}><Settings size={18} /> הגדרות גישה</h3>
        <input type="password" placeholder="Gemini API Key" value={aiKey} onChange={e => setAiKey(e.target.value)} style={inputStyle} />
        <input type="password" placeholder="GitHub Personal Access Token" value={githubToken} onChange={e => setGithubToken(e.target.value)} style={inputStyle} />
      </section>

      {/* בחירת פרויקט ותצוגת הקשר */}
      {owner && (
        <section style={{ background: '#f0fdf4', padding: '15px', borderRadius: '12px', border: '1px solid #dcfce7', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <strong>👤 מחובר כ: {owner}</strong>
            <button onClick={fetchRepos} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><RefreshCw size={16} /></button>
          </div>
          <select value={selectedRepo} onChange={e => setSelectedRepo(e.target.value)} style={{ ...inputStyle, width: '100%' }}>
            {repos.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          
          {readme && (
            <div style={{ marginTop: '10px', padding: '10px', background: 'white', borderRadius: '6px', fontSize: '13px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b', marginBottom: '5px' }}><FileText size={14} /> README.md הנוכחי:</div>
              <div style={{ maxHeight: '80px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>{readme}</div>
            </div>
          )}
        </section>
      )}

      {/* קלט והרצה */}
      <textarea 
        value={prompt} 
        onChange={e => setPrompt(e.target.value)} 
        placeholder="מה תרצה שהסוכן יבנה או ישנה?"
        style={{ ...inputStyle, height: '80px', fontSize: '16px' }}
      />
      
      <button 
        onClick={generatePlan} 
        disabled={loading || executing || !selectedRepo} 
        style={{ ...buttonStyle, background: '#2563eb' }}
      >
        {loading ? <Loader2 className="animate-spin" style={{margin:'0 auto'}} /> : "צור תוכנית עבודה חכמה 📋"}
      </button>

      {/* רשימת שלבים */}
      {plan && (
        <div style={{ marginTop: '30px', animation: 'fadeIn 0.5s' }}>
          <h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>📋 שלבי עבודה מוצעים:</h3>
          {plan.map((step, index) => (
            <div key={index} style={{ 
              display: 'flex', justifyContent: 'space-between', padding: '15px', 
              background: index === currentStep ? '#eff6ff' : 'white', 
              border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '8px' 
            }}>
              <div>
                <strong>{step.id}. {step.description}</strong>
                <div style={{ fontSize: '12px', color: '#64748b' }}>קובץ: {step.affectedFiles?.[0]}</div>
              </div>
              {index < currentStep || (currentStep === -1 && executing === false && index < plan.length && plan[index].done) ? (
                <CheckCircle2 color="#10b981" />
              ) : index === currentStep ? (
                <Loader2 className="animate-spin" color="#2563eb" />
              ) : null}
            </div>
          ))}

          {/* מצב עדכון מפה */}
          {currentStep === -2 && (
            <div style={{ padding: '15px', background: '#f0fdfa', border: '1px solid #5eead4', borderRadius: '8px', textAlign: 'center', color: '#0f766e', fontWeight: 'bold' }}>
              <RefreshCw size={20} className="animate-spin" style={{ marginBottom: '10px' }} />
              <br /> מעדכן README ומפת פרויקט לסנכרון עתידי...
            </div>
          )}

          <button 
            onClick={executeFullPlan} 
            disabled={executing} 
            style={{ ...buttonStyle, background: '#10b981', marginTop: '20px', fontSize: '18px' }}
          >
            {executing ? "הסוכן בפעולה... 🔨" : <><Rocket size={20} /> בצע הכל ועדכן Context</>}
          </button>
        </div>
      )}
    </div>
  );
};

// --- Styles ---
const inputStyle = { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontFamily: 'inherit' };
const buttonStyle = { width: '100%', padding: '14px', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' };

export default App;
