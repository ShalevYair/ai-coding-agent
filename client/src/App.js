import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Loader2, CheckCircle2, Settings, Send, BrainCircuit, Rocket, X, User, Bot } from 'lucide-react';

const App = () => {
  const [aiKey, setAiKey] = useState(localStorage.getItem('ai-key') || '');
  const [githubToken, setGithubToken] = useState(localStorage.getItem('github-token') || '');
  const [owner, setOwner] = useState('');
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(localStorage.getItem('selected-repo') || '');
  const [readme, setReadme] = useState('');
  const [projectMap, setProjectMap] = useState(null);
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingPlan, setPendingPlan] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const chatEndRef = useRef(null);
  const headers = { 'x-github-token': githubToken, 'x-ai-key': aiKey };

  // גלילה אוטומטית לסוף הצ'אט
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (!aiKey || !githubToken) setIsSettingsOpen(true);
    if (githubToken) fetchRepos();
    // הודעת שלום
    setMessages([{ role: 'bot', text: 'שלום! מה תרצה שנעשה היום בפרויקט?' }]);
  }, []);

  const fetchRepos = async () => {
    try {
      const res = await axios.get('/api/user/repos', { headers });
      setOwner(res.data.owner); setRepos(res.data.repos);
      if (res.data.repos.length > 0 && !selectedRepo) setSelectedRepo(res.data.repos[0]);
    } catch (e) {}
  };

  const fetchContext = async () => {
    try {
      const res = await axios.get(`/api/repo/context?owner=${owner}&repo=${selectedRepo}`, { headers });
      setReadme(res.data.readme); setProjectMap(res.data.projectMap);
    } catch (e) {}
  };

  useEffect(() => { if (selectedRepo && owner) fetchContext(); }, [selectedRepo, owner]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    const userMsg = inputText;
    setInputText('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await axios.post('/api/chat', {
        prompt: userMsg,
        history: messages,
        context: { repo: selectedRepo, readme, projectMap }
      }, { headers });

      const aiRes = res.data.response;
      
      // בדיקה אם יש תוכנית עבודה מוחבאת בתוך התגובה
      const planMatch = aiRes.match(/\[\[\[(.*?)\]\]\]/s);
      if (planMatch) {
        setPendingPlan(JSON.parse(planMatch[1]));
        const cleanText = aiRes.replace(/\[\[\[.*?\]\]\]/s, '').trim();
        setMessages(prev => [...prev, { role: 'bot', text: cleanText, hasPlan: true }]);
      } else {
        setMessages(prev => [...prev, { role: 'bot', text: aiRes }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'bot', text: 'מצטער, קרתה שגיאה בחיבור.' }]);
    }
    setLoading(false);
  };

  const executePlan = async () => {
    setExecuting(true);
    setMessages(prev => [...prev, { role: 'bot', text: 'מתחיל בביצוע העדכונים בגיטהאב... 🔨' }]);
    try {
      for (const step of pendingPlan) {
        await axios.post('/api/execute', {
          owner, repo: selectedRepo, filePath: step.affectedFiles[0], instructions: step.description
        }, { headers });
      }
      await axios.post('/api/repo/finalize', { owner, repo: selectedRepo, prompt: "Chat update" }, { headers });
      setMessages(prev => [...prev, { role: 'bot', text: '✅ הכל מוכן! הקוד, ה-README והמפה עודכנו.' }]);
      setPendingPlan(null);
      fetchContext();
    } catch (e) {
      setMessages(prev => [...prev, { role: 'bot', text: '❌ הביצוע נכשל באמצע. בדוק את גיטהאב.' }]);
    }
    setExecuting(false);
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BrainCircuit color="#2563eb" size={28} />
          <h2 style={{ margin: 0 }}>AI Coding Agent</h2>
        </div>
        <button onClick={() => setIsSettingsOpen(true)} style={settingsToggleStyle}>
          <Settings size={20} />
          {selectedRepo && <span style={repoTag}>{selectedRepo}</span>}
        </button>
      </div>

      {/* Chat Window */}
      <div style={chatBoxStyle}>
        {messages.map((m, i) => (
          <div key={i} style={m.role === 'user' ? userRowStyle : botRowStyle}>
            <div style={m.role === 'user' ? userBubbleStyle : botBubbleStyle}>
              {m.text}
              {m.hasPlan && !executing && (
                <button onClick={executePlan} style={confirmButtonStyle}>
                  <Rocket size={16} /> אשר ביצוע תוכנית
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && <div style={botRowStyle}><Loader2 className="animate-spin" size={20} /></div>}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div style={inputContainerStyle}>
        <input 
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && sendMessage()}
          placeholder="כתוב כאן הודעה..."
          style={inputFieldStyle}
          disabled={executing}
        />
        <button onClick={sendMessage} disabled={loading || executing} style={sendButtonStyle}>
          <Send size={20} />
        </button>
      </div>

      {/* Settings Modal (אותו לוגיקה כמו קודם) */}
      {isSettingsOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3>⚙️ הגדרות</h3>
              <X onClick={() => setIsSettingsOpen(false)} style={{cursor:'pointer'}} />
            </div>
            <input type="password" placeholder="Gemini Key" value={aiKey} onChange={e => setAiKey(e.target.value)} style={modalInputStyle} />
            <input type="password" placeholder="GitHub Token" value={githubToken} onChange={e => setGithubToken(e.target.value)} style={modalInputStyle} />
            <select value={selectedRepo} onChange={e => setSelectedRepo(e.target.value)} style={modalInputStyle}>
               {repos.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <div style={readmeStyle}>{readme}</div>
            <button onClick={() => setIsSettingsOpen(false)} style={saveButtonStyle}>שמור וסגור</button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Styles ---
const containerStyle = { height: '100vh', display: 'flex', flexDirection: 'column', direction: 'rtl', fontFamily: 'system-ui', backgroundColor: '#f9fafb' };
const headerStyle = { padding: '15px 20px', background: 'white', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const chatBoxStyle = { flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' };
const userRowStyle = { display: 'flex', justifyContent: 'flex-start' };
const botRowStyle = { display: 'flex', justifyContent: 'flex-end' };
const userBubbleStyle = { background: '#2563eb', color: 'white', padding: '12px 18px', borderRadius: '18px 18px 0 18px', maxWidth: '80%', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' };
const botBubbleStyle = { background: 'white', color: '#1f2937', padding: '12px 18px', borderRadius: '18px 18px 18px 0', maxWidth: '80%', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const inputContainerStyle = { padding: '15px', background: 'white', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '10px' };
const inputFieldStyle = { flex: 1, padding: '12px', borderRadius: '25px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '16px' };
const sendButtonStyle = { background: '#2563eb', color: 'white', border: 'none', width: '45px', height: '45px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const confirmButtonStyle = { marginTop: '10px', width: '100%', padding: '8px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' };
const settingsToggleStyle = { background: '#f3f4f6', border: 'none', padding: '8px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' };
const repoTag = { fontSize: '12px', fontWeight: 'bold', color: '#2563eb' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const modalContentStyle = { background: 'white', padding: '25px', borderRadius: '20px', width: '90%', maxWidth: '450px' };
const modalInputStyle = { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' };
const saveButtonStyle = { width: '100%', padding: '12px', background: '#1f2937', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' };
const readmeStyle = { maxHeight: '150px', overflowY: 'auto', background: '#f8fafc', padding: '10px', fontSize: '12px', direction: 'ltr', textAlign: 'left', marginBottom: '10px', border: '1px solid #eee' };

export default App;
