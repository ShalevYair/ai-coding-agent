import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, CheckCircle2, Settings, RefreshCw, FileText, BrainCircuit, Rocket, X } from 'lucide-react';

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
  const [currentStep, setCurrentStep] = useState(-1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const headers = { 'x-github-token': githubToken, 'x-ai-key': aiKey };

  // --- Effects ---
  useEffect(() => {
    // בדיקה בכניסה ראשונה: אם אין מפתחות, פתח הגדרות אוטומטית
    if (!aiKey || !githubToken) {
      setIsSettingsOpen(true);
    }
    if (githubToken && githubToken.startsWith('ghp_')) fetchRepos();
  }, []);

  useEffect(() => {
    localStorage.setItem('ai-key', aiKey);
    localStorage.setItem('github-token', githubToken);
  }, [aiKey, githubToken]);

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
      for (let i = 0; i < plan.length; i++) {
        setCurrentStep(i);
        await axios.post('/api/execute', {
          owner, repo: selectedRepo,
          filePath: plan[i].affectedFiles[0],
          instructions: plan[i].description
        }, { headers });
      }
      setCurrentStep(-2); 
      await axios.post('/api/repo/finalize', { owner, repo: selectedRepo, prompt }, { headers });
      alert("✅ המשימה הושלמה בהצלחה!");
      fetchContext();
    } catch (e) { alert("❌ נכשל בשלב " + (currentStep + 1)); }
    setExecuting(false);
    setCurrentStep(-1);
  };

  // --- UI Components ---
  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui', maxWidth: '700px', margin: '0 auto', direction: 'rtl', color: '#1e293b', position: 'relative' }}>
      
      {/* כפתור גלגל שיניים בצד שמאל למעלה */}
      <button 
        onClick={() => setIsSettingsOpen(true)}
        style={{ position: 'absolute', left: '20px', top: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
      >
        <Settings size={28} />
      </button>

      <h1 style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '40px' }}>
        <BrainCircuit color="#2563eb" size={32} /> AI Coding Agent
      </h1>

      {/* חלון הגדרות (Modal) */}
      {isSettingsOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>⚙️ הגדרות גישה</h3>
              <button onClick={() => setIsSettingsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <label style={labelStyle}>Gemini API Key:</label>
            <input type="password" placeholder="הזן מפתח Gemini" value={aiKey} onChange={e => setAiKey(e.target.value)} style={inputStyle} />
            
            <label style={labelStyle}>GitHub Token:</label>
            <input type="password" placeholder="ghp_..." value={githubToken} onChange={e => setGithubToken(e.target.value)} style={inputStyle} />
            
            <button 
              onClick={() => { setIsSettingsOpen(false); fetchRepos(); }}
              style={{ ...buttonStyle, background: '#2563eb', marginTop: '10px' }}
            >
              שמור וסגור
            </button>
          </div>
        </div>
      )}

      {/* ממשק ראשי - בחירת פרויקט */}
      {owner && (
        <section style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <strong>👤 משתמש: {owner}</strong>
            <button onClick={fetchRepos} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><RefreshCw size={16} /></button>
          </div>
          <select value={selectedRepo} onChange={e => setSelectedRepo(e.target.value)} style={{ ...inputStyle, width: '100%', marginBottom: 0 }}>
            {repos.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          
          {readme && (
            <div style={{ marginTop: '12px', padding: '10px', background: 'white', borderRadius: '8px', fontSize: '13px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b', marginBottom: '5px' }}><FileText size={14} /> README הנוכחי:</div>
              <div style={{ maxHeight: '60px', overflowY: 'auto' }}>{readme}</div>
            </div>
          )}
        </section>
      )}

      {/* אזור הקלט */}
      <div style={{ marginBottom: '20px' }}>
        <textarea 
          value={prompt} 
          onChange={e => setPrompt(e.target.value)} 
          placeholder="מה תרצה לבנות היום?"
          style={{ ...inputStyle, height: '100px', fontSize: '16px', resize: 'none' }}
        />
        <button 
          onClick={generatePlan} 
          disabled={loading || executing || !selectedRepo} 
          style={{ ...buttonStyle, background: '#2563eb' }}
        >
          {loading ? <Loader2 className="animate-spin" /> : "צור תוכנית עבודה חכמה 🧠"}
        </button>
      </div>

      {/* תוכנית עבודה */}
      {plan && (
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>📋 שלבי עבודה:</h3>
          {plan.map((step, index) => (
            <div key={index} style={{ 
              display: 'flex', justifyContent: 'space-between', padding: '15px', 
              background: index === currentStep ? '#eff6ff' : 'white', 
              border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '8px' 
            }}>
              <div>
                <strong>{step.id}. {step.description}</strong>
                <div style={{ fontSize: '12px', color: '#64748b' }}>קובץ: {step.affectedFiles?.[0]}</div>
              </div>
              {index < currentStep ? (
                <CheckCircle2 color="#10b981" />
              ) : index === currentStep ? (
                <Loader2 className="animate-spin" color="#2563eb" />
              ) : null}
            </div>
          ))}

          {currentStep === -2 && (
            <div style={{ padding: '15px', background: '#f0fdfa', borderRadius: '10px', textAlign: 'center', color: '#0f766e', fontWeight: 'bold' }}>
              <RefreshCw size={18} className="animate-spin" /> מעדכן Context...
            </div>
          )}

          <button 
            onClick={executeFullPlan} 
            disabled={executing} 
            style={{ ...buttonStyle, background: '#10b981', marginTop: '15px' }}
          >
            {executing ? "הסוכן בפעולה..." : <><Rocket size={18} /> בצע את כל השלבים</>}
          </button>
        </div>
      )}
    </div>
  );
};

// --- Styles ---
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalContentStyle = { background: 'white', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' };
const inputStyle = { width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' };
const buttonStyle = { width: '100%', padding: '14px', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' };
const labelStyle = { display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#475569' };

export default App;
