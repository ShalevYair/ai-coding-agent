import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, CheckCircle2, Settings, RefreshCw, FileText, BrainCircuit, Rocket, X, User } from 'lucide-react';

const App = () => {
  // --- State Management ---
  const [aiKey, setAiKey] = useState(localStorage.getItem('ai-key') || '');
  const [githubToken, setGithubToken] = useState(localStorage.getItem('github-token') || '');
  const [owner, setOwner] = useState('');
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(localStorage.getItem('selected-repo') || '');
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
    if (!aiKey || !githubToken) {
      setIsSettingsOpen(true);
    }
    if (githubToken) fetchRepos();
  }, []);

  useEffect(() => {
    localStorage.setItem('ai-key', aiKey);
    localStorage.setItem('github-token', githubToken);
    localStorage.setItem('selected-repo', selectedRepo);
  }, [aiKey, githubToken, selectedRepo]);

  useEffect(() => {
    if (selectedRepo && owner) fetchContext();
  }, [selectedRepo, owner]);

  // --- API Calls ---
  const fetchRepos = async () => {
    if (!githubToken) return;
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
      setReadme(res.data.readme || 'No README.md found.');
      setProjectMap(res.data.projectMap);
    } catch (e) { setReadme('Failed to load context.'); }
  };

  const generatePlan = async () => {
    if (!selectedRepo) {
      setIsSettingsOpen(true);
      return;
    }
    setLoading(true);
    setPlan(null);
    try {
      const res = await axios.post('/api/plan', { 
        prompt, owner, repo: selectedRepo, context: { readme, projectMap } 
      }, { headers });
      setPlan(res.data.plan);
    } catch (e) { alert("Error: " + (e.response?.data?.error || e.message)); }
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
      alert("✅ Done! Project updated.");
      fetchContext();
    } catch (e) { alert("❌ Failed at step " + (currentStep + 1)); }
    setExecuting(false);
    setCurrentStep(-1);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui', maxWidth: '700px', margin: '0 auto', direction: 'rtl', color: '#1e293b' }}>
      
      {/* Header & Settings Trigger */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BrainCircuit color="#2563eb" size={32} /> AI Agent
        </h1>
        <button onClick={() => setIsSettingsOpen(true)} style={settingsButtonStyle}>
          <Settings size={24} />
          {selectedRepo && <span style={repoBadgeStyle}>{selectedRepo}</span>}
        </button>
      </div>

      {/* Main UI - Prompt Only */}
      <div style={{ marginBottom: '20px' }}>
        <textarea 
          value={prompt} 
          onChange={e => setPrompt(e.target.value)} 
          placeholder="מה תרצה לבנות היום?"
          style={promptAreaStyle}
        />
        <button 
          onClick={generatePlan} 
          disabled={loading || executing} 
          style={{ ...buttonStyle, background: '#2563eb' }}
        >
          {loading ? <Loader2 className="animate-spin" /> : "צור תוכנית עבודה חכמה 🧠"}
        </button>
      </div>

      {/* Plan Steps */}
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
                <div style={{ fontSize: '12px', color: '#64748b' }}>File: {step.affectedFiles?.[0]}</div>
              </div>
              {index < currentStep ? <CheckCircle2 color="#10b981" /> : index === currentStep ? <Loader2 className="animate-spin" color="#2563eb" /> : null}
            </div>
          ))}

          {currentStep === -2 && (
            <div style={finalizingStyle}>
              <RefreshCw size={18} className="animate-spin" /> Updating context & README...
            </div>
          )}

          <button onClick={executeFullPlan} disabled={executing} style={{ ...buttonStyle, background: '#10b981', marginTop: '15px' }}>
            {executing ? "הסוכן בפעולה..." : <><Rocket size={18} /> בצע את כל השלבים</>}
          </button>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>⚙️ הגדרות והקשר</h3>
              <button onClick={() => setIsSettingsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingLeft: '5px' }}>
              {/* API Keys Section */}
              <div style={sectionStyle}>
                <label style={labelStyle}>Gemini API Key:</label>
                <input type="password" value={aiKey} onChange={e => setAiKey(e.target.value)} style={inputStyle} />
                
                <label style={labelStyle}>GitHub Token:</label>
                <input type="password" value={githubToken} onChange={e => setGithubToken(e.target.value)} style={inputStyle} />
              </div>

              {/* User & Repo Section */}
              <div style={sectionStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#475569' }}>
                  <User size={16} /> <strong>User:</strong> {owner || 'Not connected'}
                  <button onClick={fetchRepos} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb' }}><RefreshCw size={14} /></button>
                </div>
                
                <label style={labelStyle}>Select Repository:</label>
                <select value={selectedRepo} onChange={e => setSelectedRepo(e.target.value)} style={inputStyle}>
                  <option value="">-- Choose a project --</option>
                  {repos.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* LTR README Section */}
              <div style={sectionStyle}>
                <label style={labelStyle}>Project Context (README.md):</label>
                <div style={readmeContainerStyle}>
                  {readme}
                </div>
              </div>
            </div>

            <button onClick={() => setIsSettingsOpen(false)} style={{ ...buttonStyle, background: '#1e293b', marginTop: '20px' }}>
              סגור ועדכן
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Styles ---
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '10px' };
const modalContentStyle = { background: 'white', padding: '25px', borderRadius: '20px', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', direction: 'rtl' };
const sectionStyle = { marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #f1f5f9' };
const inputStyle = { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '14px' };
const buttonStyle = { width: '100%', padding: '14px', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'opacity 0.2s' };
const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#1e293b' };
const promptAreaStyle = { width: '100%', height: '120px', padding: '15px', borderRadius: '12px', border: '2px solid #e2e8f0', marginBottom: '15px', boxSizing: 'border-box', fontSize: '16px', resize: 'none', outline: 'none', focus: 'border-color: #2563eb' };
const settingsButtonStyle = { background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b' };
const repoBadgeStyle = { fontSize: '12px', background: '#eff6ff', color: '#2563eb', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold' };
const readmeContainerStyle = { background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', maxHeight: '150px', overflowY: 'auto', direction: 'ltr', textAlign: 'left', whiteSpace: 'pre-wrap', color: '#334155', fontFamily: 'monospace' };
const finalizingStyle = { padding: '15px', background: '#f0fdfa', borderRadius: '10px', textAlign: 'center', color: '#0f766e', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' };

export default App;
