import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Send, Loader2, CheckCircle2, ChevronDown } from 'lucide-react';

const formatMessage = (text) => {
  if (!text) return null;
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, index) => {
    if (part.startsWith('```')) {
      const code = part.replace(/```[a-z]*\n?|```/g, '').trim();
      return (
        <div key={index} style={{ direction: 'ltr', textAlign: 'left', margin: '15px 0' }}>
          <pre style={{ background: '#1e293b', color: '#e2e8f0', padding: '12px', borderRadius: '8px', overflowX: 'auto', fontSize: '13px', border: '1px solid #334155' }}>
            <code>{code}</code>
          </pre>
        </div>
      );
    }
    return <span key={index} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>;
  });
};

function App() {
  const [messages, setMessages] = useState([{ role: 'bot', text: 'שלום! מה תרצה שנעשה היום?' }]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [pendingPlan, setPendingPlan] = useState(null);
  
  // הגדרות
  const [aiKey, setAiKey] = useState(localStorage.getItem('ai_key') || '');
  const [githubToken, setGithubToken] = useState(localStorage.getItem('gh_token') || '');
  const [owner, setOwner] = useState(localStorage.getItem('owner') || '');
  const [selectedRepo, setSelectedRepo] = useState(localStorage.getItem('selected_repo') || '');
  const [repoList, setRepoList] = useState([]);

  // 1. הקפצה אוטומטית אם חסרים מפתחות
  useEffect(() => {
    if (!aiKey || !githubToken) {
      setShowSettings(true);
    }
  }, []);

  // 2. שמירה ל-LocalStorage
  useEffect(() => {
    localStorage.setItem('ai_key', aiKey);
    localStorage.setItem('gh_token', githubToken);
    localStorage.setItem('owner', owner);
    localStorage.setItem('selected_repo', selectedRepo);
  }, [aiKey, githubToken, owner, selectedRepo]);

  // 3. פונקציה להבאת נתונים מגיטהאב אוטומטית
  const fetchGitHubData = async () => {
    if (!githubToken) return;
    try {
      const res = await axios.get('/api/github/user-data', {
        headers: { 'x-github-token': githubToken }
      });
      setOwner(res.data.username);
      setRepoList(res.data.repos);
      if (!selectedRepo && res.data.repos.length > 0) {
        setSelectedRepo(res.data.repos[0]); // ברירת מחדל לאחרון שעודכן
      }
    } catch (e) {
      alert("שגיאה במשיכת נתונים מגיטהאב. בדוק את ה-Token.");
    }
  };

  const headers = { 'x-ai-key': aiKey, 'x-github-token': githubToken };

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
        context: { owner, repo: selectedRepo, projectMap: {} }
      }, { headers });

      const aiRes = res.data.response;
      const planMatch = aiRes.match(/\[\[\[(.*?)\]\]\]/s);
      if (planMatch) {
        setPendingPlan(JSON.parse(planMatch[1]));
        const cleanText = aiRes.replace(/\[\[\[.*?\]\]\]/s, '').trim();
        setMessages(prev => [...prev, { role: 'bot', text: cleanText, hasPlan: true }]);
      } else {
        setMessages(prev => [...prev, { role: 'bot', text: aiRes }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'bot', text: `⚠️ שגיאה: ${e.response?.data?.error || e.message}` }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }} dir="rtl">
      
      {/* Header */}
      <div style={{ padding: '15px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>AI Agent 🤖</h1>
          <span style={{ fontSize: '12px', color: '#64748b' }}>{selectedRepo || 'לא נבחר פרויקט'}</span>
        </div>
        <Settings onClick={() => setShowSettings(true)} style={{ cursor: 'pointer', color: '#64748b' }} />
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-start' : 'flex-end', marginBottom: '15px' }}>
            <div style={{ 
              maxWidth: '85%', padding: '12px 16px', borderRadius: '15px',
              background: m.role === 'user' ? '#3b82f6' : '#fff',
              color: m.role === 'user' ? '#fff' : '#1e293b',
              border: m.role === 'user' ? 'none' : '1px solid #e2e8f0'
            }}>
              {formatMessage(m.text)}
              {m.hasPlan && <button onClick={() => {/* פונקציית ביצוע */}} style={executeButtonStyle}>אשר ביצוע בגיטהאב</button>}
            </div>
          </div>
        ))}
        {loading && <Loader2 className="animate-spin" style={{ margin: '0 auto' }} />}
      </div>

      {/* Input */}
      <div style={{ padding: '20px', background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px' }}>
        <input value={inputText} onChange={e => setInputText(e.target.value)} onKeyPress={e => e.key === 'Enter' && sendMessage()} placeholder="מה תרצה לפתח?" style={inputStyle} />
        <button onClick={sendMessage} style={buttonStyle}><Send size={20} /></button>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <h3>הגדרות חיבור</h3>
            <input placeholder="Gemini API Key" type="password" value={aiKey} onChange={e => setAiKey(e.target.value)} style={modalInputStyle} />
            
            <div style={{ display: 'flex', gap: '5px' }}>
              <input placeholder="GitHub Token" type="password" value={githubToken} onChange={e => setGithubToken(e.target.value)} style={modalInputStyle} />
              <button onClick={fetchGitHubData} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', padding: '0 10px', marginBottom: '10px' }}>טען</button>
            </div>

            <div style={{ margin: '10px 0', fontSize: '14px' }}>
              <strong>משתמש:</strong> {owner || 'יש להזין טוקן'}
            </div>

            <label style={{ fontSize: '12px', display: 'block', marginBottom: '5px' }}>בחר פרויקט (Repository):</label>
            <select value={selectedRepo} onChange={e => setSelectedRepo(e.target.value)} style={modalInputStyle}>
              {repoList.length === 0 && <option>טען רשימה קודם...</option>}
              {repoList.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            <button onClick={() => setShowSettings(false)} style={saveButtonStyle}>שמור וסגור</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
const modalOverlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalStyle = { background: '#fff', padding: '25px', borderRadius: '15px', width: '90%', maxWidth: '400px' };
const modalInputStyle = { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' };
const inputStyle = { flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' };
const buttonStyle = { background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '10px', cursor: 'pointer' };
const saveButtonStyle = { width: '100%', padding: '12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };
const executeButtonStyle = { marginTop: '12px', width: '100%', padding: '10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' };

export default App;
