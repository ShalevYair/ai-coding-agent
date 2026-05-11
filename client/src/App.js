import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Send, Loader2, CheckCircle2, X } from 'lucide-react';

// פונקציה שמסדרת את התצוגה: עברית בימין, קוד (```) בשמאל עם רקע כהה
const formatMessage = (text) => {
  if (!text) return null;
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, index) => {
    if (part.startsWith('```')) {
      const code = part.replace(/```[a-z]*\n?|```/g, '').trim();
      return (
        <div key={index} style={{ direction: 'ltr', textAlign: 'left', margin: '15px 0' }}>
          <pre style={{ 
            background: '#1e293b', color: '#e2e8f0', padding: '12px', 
            borderRadius: '8px', overflowX: 'auto', fontSize: '13px', 
            border: '1px solid #334155', fontFamily: 'monospace' 
          }}>
            <code>{code}</code>
          </pre>
        </div>
      );
    }
    return <span key={index} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>;
  });
};

function App() {
  const [messages, setMessages] = useState([{ role: 'bot', text: 'היי! אני מוכן. מה בונים היום?' }]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [pendingPlan, setPendingPlan] = useState(null);
  
  // טעינה מהזיכרון של הדפדפן
  const [aiKey, setAiKey] = useState(localStorage.getItem('ai_key') || '');
  const [githubToken, setGithubToken] = useState(localStorage.getItem('gh_token') || '');
  const [owner, setOwner] = useState(localStorage.getItem('owner') || '');
  const [selectedRepo, setSelectedRepo] = useState(localStorage.getItem('selected_repo') || '');
  const [repoList, setRepoList] = useState([]);

  // שמירה אוטומטית וטעינת נתונים מגיט
  useEffect(() => {
    localStorage.setItem('ai_key', aiKey);
    localStorage.setItem('gh_token', githubToken);
    localStorage.setItem('owner', owner);
    localStorage.setItem('selected_repo', selectedRepo);

    // אם יש טוקן ועדיין לא טענו רשימת פרויקטים - טען אוטומטית
    if (githubToken && githubToken.length > 20 && repoList.length === 0) {
      fetchGitHubData();
    }
  }, [aiKey, githubToken, owner, selectedRepo, repoList.length]);

  // פתיחת הגדרות אוטומטית אם חסר משהו
  useEffect(() => {
    if (!aiKey || !githubToken || !selectedRepo) {
      setShowSettings(true);
    }
  }, []);

  const fetchGitHubData = async () => {
    try {
      const res = await axios.get('/api/github/user-data', {
        headers: { 'x-github-token': githubToken }
      });
      setOwner(res.data.username);
      setRepoList(res.data.repos);
      // אם לא נבחר רפו, קח את הראשון ברשימה כברירת מחדל
      if (!selectedRepo && res.data.repos.length > 0) {
        setSelectedRepo(res.data.repos[0]);
      }
    } catch (e) {
      console.error("GitHub Sync Error");
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || loading) return;
    const userMsg = inputText;
    setInputText('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await axios.post('/api/chat', {
        prompt: userMsg,
        history: messages,
        context: { owner, repo: selectedRepo }
      }, { headers: { 'x-ai-key': aiKey, 'x-github-token': githubToken } });

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

  const executePlan = async () => {
    if (!pendingPlan) return;
    setLoading(true);
    try {
      await axios.post('/api/execute', {
        plan: pendingPlan,
        context: { owner, repo: selectedRepo }
      }, { headers: { 'x-ai-key': aiKey, 'x-github-token': githubToken } });
      
      setMessages(prev => [...prev, { role: 'bot', text: '✅ בוצע! השינויים נדחפו לגיטהאב.' }]);
      setPendingPlan(null);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'bot', text: `❌ שגיאה בביצוע: ${e.message}` }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', height: '100vh', display: 'flex', flexDirection: 'column', background: '#f1f5f9' }} dir="rtl">
      
      {/* Header */}
      <div style={{ padding: '15px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>AI Coding Agent 🤖</h1>
          <div style={{ fontSize: '11px', color: '#3b82f6', fontWeight: '600' }}>{selectedRepo || 'בחר פרויקט...'}</div>
        </div>
        <Settings onClick={() => setShowSettings(true)} style={{ cursor: 'pointer', color: '#64748b' }} size={22} />
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-start' : 'flex-end', marginBottom: '15px' }}>
            <div style={{ 
              maxWidth: '90%', padding: '12px 16px', borderRadius: '15px',
              background: m.role === 'user' ? '#3b82f6' : '#fff',
              color: m.role === 'user' ? '#fff' : '#1e293b',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              border: m.role === 'user' ? 'none' : '1px solid #e2e8f0'
            }}>
              {formatMessage(m.text)}
              {m.hasPlan && (
                <button onClick={executePlan} style={{ marginTop: '12px', width: '100%', padding: '10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <CheckCircle2 size={18} /> אשר ביצוע בגיט
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && <Loader2 className="animate-spin" style={{ margin: '10px auto', display: 'block', color: '#3b82f6' }} />}
      </div>

      {/* Input */}
      <div style={{ padding: '15px', background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px' }}>
        <input 
          value={inputText} 
          onChange={e => setInputText(e.target.value)} 
          onKeyPress={e => e.key === 'Enter' && sendMessage()} 
          placeholder="מה נבנה עכשיו?" 
          style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }} 
        />
        <button onClick={sendMessage} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', cursor: 'pointer' }}>
          <Send size={20} />
        </button>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#fff', padding: '25px', borderRadius: '20px', width: '100%', maxWidth: '400px', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <X onClick={() => setShowSettings(false)} style={{ position: 'absolute', left: '15px', top: '15px', cursor: 'pointer', color: '#94a3b8' }} size={24} />
            <h2 style={{ marginTop: 0, fontSize: '18px', marginBottom: '20px' }}>הגדרות חיבור</h2>
            
            <label style={labelStyle}>Gemini API Key</label>
            <input type="password" value={aiKey} onChange={e => setAiKey(e.target.value)} style={modalInputStyle} placeholder="הדבק מפתח גמיני..." />
            
            <label style={labelStyle}>GitHub Token</label>
            <input type="password" value={githubToken} onChange={e => setGithubToken(e.target.value)} style={modalInputStyle} placeholder="הדבק טוקן גיטהאב..." />

            {owner && <div style={{ fontSize: '13px', marginBottom: '15px', color: '#10b981', fontWeight: '600' }}>✅ מחובר כ: {owner}</div>}

            <label style={labelStyle}>בחר פרויקט פעיל</label>
            <select value={selectedRepo} onChange={e => setSelectedRepo(e.target.value)} style={modalInputStyle}>
              {repoList.length === 0 && <option>ממתין לטוקן...</option>}
              {repoList.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            <button onClick={() => setShowSettings(false)} style={{ width: '100%', padding: '14px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>שמור וצא</button>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = { fontSize: '12px', color: '#64748b', marginBottom: '6px', display: 'block', fontWeight: '600' };
const modalInputStyle = { width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '10px', border: '1px solid #e2e8f0', boxSizing: 'border-box', fontSize: '14px' };

export default App;
