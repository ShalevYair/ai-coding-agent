import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Send, Loader2, CheckCircle2 } from 'lucide-react';

// פונקציית עזר לעיצוב קוד (LTR) וטקסט רגיל (RTL)
const formatMessage = (text) => {
  if (!text) return null;
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, index) => {
    if (part.startsWith('```')) {
      const code = part.replace(/```[a-z]*\n?|```/g, '').trim();
      return (
        <div key={index} style={{ direction: 'ltr', textAlign: 'left', margin: '15px 0' }}>
          <pre style={{ 
            background: '#1e293b', 
            color: '#e2e8f0', 
            padding: '12px', 
            borderRadius: '8px', 
            overflowX: 'auto', 
            fontSize: '13px', 
            border: '1px solid #334155',
            fontFamily: 'monospace'
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
  const [messages, setMessages] = useState([{ role: 'bot', text: 'שלום! מה תרצה שנעשה היום בפרויקט?' }]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [pendingPlan, setPendingPlan] = useState(null);

  // הגדרות (נשמרות בדפדפן)
  const [aiKey, setAiKey] = useState(localStorage.getItem('ai_key') || '');
  const [githubToken, setGithubToken] = useState(localStorage.getItem('gh_token') || '');
  const [owner, setOwner] = useState(localStorage.getItem('owner') || '');
  const [selectedRepo, setSelectedRepo] = useState(localStorage.getItem('selected_repo') || '');

  useEffect(() => {
    localStorage.setItem('ai_key', aiKey);
    localStorage.setItem('gh_token', githubToken);
    localStorage.setItem('owner', owner);
    localStorage.setItem('selected_repo', selectedRepo);
  }, [aiKey, githubToken, owner, selectedRepo]);

  const headers = {
    'x-ai-key': aiKey,
    'x-github-token': githubToken
  };

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
        context: { 
          owner, 
          repo: selectedRepo,
          projectMap: {} // השרת ימלא את זה אוטומטית מה-realTimeFileList
        }
      }, { headers });

      const aiRes = res.data.response;
      
      // בדיקה אם יש תוכנית עבודה (JSON בתוך [[[ ]]])
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
      }, { headers });
      
      setMessages(prev => [...prev, { role: 'bot', text: '✅ המשימה בוצעה בהצלחה ודחפתי את השינויים לגיט!' }]);
      setPendingPlan(null);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'bot', text: `❌ כשל בביצוע: ${e.message}` }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', fontFamily: 'system-ui' }} dir="rtl">
      
      {/* Header */}
      <div style={{ padding: '15px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>AI Coding Agent 🤖</h1>
        <Settings onClick={() => setShowSettings(true)} style={{ cursor: 'pointer', color: '#64748b' }} />
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ 
            display: 'flex', 
            justifyContent: m.role === 'user' ? 'flex-start' : 'flex-end',
            marginBottom: '15px' 
          }}>
            <div style={{ 
              maxWidth: '85%', 
              padding: '12px 16px', 
              borderRadius: '15px',
              fontSize: '15px',
              background: m.role === 'user' ? '#3b82f6' : '#fff',
              color: m.role === 'user' ? '#fff' : '#1e293b',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              border: m.role === 'user' ? 'none' : '1px solid #e2e8f0'
            }}>
              {formatMessage(m.text)}
              
              {m.hasPlan && (
                <button 
                  onClick={executePlan}
                  style={{ 
                    marginTop: '12px', width: '100%', padding: '10px', background: '#10b981', 
                    color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  <CheckCircle2 size={18} /> אשר ביצוע בגיטהאב
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && <div style={{ textAlign: 'center', color: '#94a3b8' }}><Loader2 className="animate-spin" /></div>}
      </div>

      {/* Input Area */}
      <div style={{ padding: '20px', background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px' }}>
        <input 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="מה תרצה לפתח?"
          style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }}
        />
        <button onClick={sendMessage} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '10px' }}>
          <Send size={20} />
        </button>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 100 }}>
          <div style={{ background: '#fff', padding: '25px', borderRadius: '15px', width: '100%', maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '15px' }}>הגדרות פרויקט</h2>
            <input placeholder="Gemini API Key" type="password" value={aiKey} onChange={e => setAiKey(e.target.value)} style={modalInputStyle} />
            <input placeholder="GitHub Personal Token" type="password" value={githubToken} onChange={e => setGithubToken(e.target.value)} style={modalInputStyle} />
            <input placeholder="GitHub Owner (username)" value={owner} onChange={e => setOwner(e.target.value)} style={modalInputStyle} />
            <input placeholder="Repository Name" value={selectedRepo} onChange={e => setSelectedRepo(e.target.value)} style={modalInputStyle} />
            <button onClick={() => setShowSettings(false)} style={{ width: '100%', padding: '12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>שמור וסגור</button>
          </div>
        </div>
      )}
    </div>
  );
}

const modalInputStyle = {
  width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box'
};

export default App;
