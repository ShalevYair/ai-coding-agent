import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Settings, Send, Loader2, CheckCircle2, X } from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatMessage = (text) => {
  if (!text) return null;
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const code = part.replace(/```[a-z]*\n?|```/g, '').trim();
      return (
        <div key={i} style={{ direction: 'ltr', textAlign: 'left', margin: '10px 0' }}>
          <pre style={{
            background: '#1e293b', color: '#e2e8f0', padding: '10px 12px',
            borderRadius: '8px', overflowX: 'auto', fontSize: '12px',
            border: '1px solid #334155', fontFamily: 'monospace', margin: 0
          }}>
            <code>{code}</code>
          </pre>
        </div>
      );
    }
    return <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>;
  });
};

// Flatten old nested structure { root: {...}, api: {...} } → { "path": "desc" }
const flattenOldStructure = (node, prefix = '') => {
  const result = {};
  Object.entries(node).forEach(([key, val]) => {
    if (typeof val === 'string') {
      result[prefix ? `${prefix}/${key}` : key] = val;
    } else if (val && typeof val === 'object') {
      const sub = key === 'root' ? '' : (prefix ? `${prefix}/${key}` : key);
      Object.assign(result, flattenOldStructure(val, sub));
    }
  });
  return result;
};

const parseMapData = (jsonString) => {
  const data = JSON.parse(jsonString);
  if (data.files) return data;
  return { ...data, files: data.structure ? flattenOldStructure(data.structure) : {} };
};

const groupByDir = (files) => {
  const groups = {};
  Object.keys(files).sort().forEach(path => {
    const dir = path.includes('/') ? path.split('/')[0] : '(root)';
    if (!groups[dir]) groups[dir] = [];
    groups[dir].push(path);
  });
  return groups;
};

// ─── Tooltip ────────────────────────────────────────────────────────────────

function Tooltip({ text, children }) {
  const [visible, setVisible] = useState(false);
  return (
    <div
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span style={{
          position: 'absolute', bottom: '115%', left: '50%',
          transform: 'translateX(-50%)',
          background: '#1e293b', color: '#f8fafc',
          padding: '3px 8px', borderRadius: '5px',
          fontSize: '11px', whiteSpace: 'nowrap',
          zIndex: 9999, pointerEvents: 'none',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
        }}>
          {text}
        </span>
      )}
    </div>
  );
}

// ─── Constants ──────────────────────────────────────────────────────────────

const RESPONSE_LENGTHS = {
  short:  { icon: '⚡', label: 'תשובות קצרות',  next: 'normal' },
  normal: { icon: '🐴', label: 'תשובות רגילות', next: 'long'   },
  long:   { icon: '🐢', label: 'תשובות ארוכות', next: 'short'  }
};

const iconBtn = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: '18px', padding: '5px', borderRadius: '6px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  lineHeight: 1
};

const modalOverlay = {
  position: 'fixed', inset: 0,
  background: 'rgba(15, 23, 42, 0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000, padding: '16px'
};

const modalCard = (maxW = '480px', maxH = '80vh') => ({
  background: '#fff', borderRadius: '16px',
  width: '100%', maxWidth: maxW,
  maxHeight: maxH, display: 'flex', flexDirection: 'column',
  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)',
  overflow: 'hidden', position: 'relative'
});

const labelStyle = {
  fontSize: '12px', color: '#64748b',
  marginBottom: '6px', display: 'block', fontWeight: '600'
};

const modalInputStyle = {
  width: '100%', padding: '11px 12px', marginBottom: '13px',
  borderRadius: '10px', border: '1px solid #e2e8f0',
  boxSizing: 'border-box', fontSize: '14px'
};

// ─── App ────────────────────────────────────────────────────────────────────

function App() {
  const [messages, setMessages] = useState([{ role: 'bot', text: 'היי! אני מוכן. מה בונים היום?' }]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingPlan, setPendingPlan] = useState(null);

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [aiKey, setAiKey] = useState(localStorage.getItem('ai_key') || '');
  const [githubToken, setGithubToken] = useState(localStorage.getItem('gh_token') || '');
  const [owner, setOwner] = useState(localStorage.getItem('owner') || '');
  const [selectedRepo, setSelectedRepo] = useState(localStorage.getItem('selected_repo') || '');
  const [repoList, setRepoList] = useState([]);

  // Response length
  const [responseLength, setResponseLength] = useState(localStorage.getItem('response_length') || 'short');

  // README modal
  const [showReadme, setShowReadme] = useState(false);
  const [readmeContent, setReadmeContent] = useState('');
  const [readmeLoading, setReadmeLoading] = useState(false);

  // Project map modal
  const [showMap, setShowMap] = useState(false);
  const [mapData, setMapData] = useState(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [selectedMapFile, setSelectedMapFile] = useState(null);

  const chatEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('ai_key', aiKey);
    localStorage.setItem('gh_token', githubToken);
    localStorage.setItem('owner', owner);
    localStorage.setItem('selected_repo', selectedRepo);
    if (githubToken && githubToken.length > 20 && repoList.length === 0) {
      fetchGitHubData();
    }
  }, [aiKey, githubToken, owner, selectedRepo, repoList.length]);

  useEffect(() => {
    if (!aiKey || !githubToken || !selectedRepo) setShowSettings(true);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    localStorage.setItem('response_length', responseLength);
  }, [responseLength]);

  const fetchGitHubData = async () => {
    try {
      const res = await axios.get('/api/github/user-data', {
        headers: { 'x-github-token': githubToken }
      });
      setOwner(res.data.username);
      setRepoList(res.data.repos);
      if (!selectedRepo && res.data.repos.length > 0) setSelectedRepo(res.data.repos[0]);
    } catch (e) {
      console.error("GitHub Sync Error");
    }
  };

  const cycleResponseLength = () => {
    setResponseLength(prev => RESPONSE_LENGTHS[prev].next);
  };

  const fetchReadme = async () => {
    setShowReadme(true);
    setReadmeLoading(true);
    try {
      const res = await axios.get('/api/file', {
        params: { owner, repo: selectedRepo, path: 'README.md' },
        headers: { 'x-github-token': githubToken }
      });
      setReadmeContent(res.data.content || 'הקובץ ריק.');
    } catch (e) {
      setReadmeContent('לא נמצא קובץ README.md בפרויקט זה.');
    }
    setReadmeLoading(false);
  };

  const fetchProjectMap = async () => {
    setShowMap(true);
    setMapLoading(true);
    setSelectedMapFile(null);
    try {
      const res = await axios.get('/api/file', {
        params: { owner, repo: selectedRepo, path: 'project_map.json' },
        headers: { 'x-github-token': githubToken }
      });
      setMapData(parseMapData(res.data.content));
    } catch (e) {
      setMapData(null);
    }
    setMapLoading(false);
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
        context: { owner, repo: selectedRepo },
        responseLength
      }, { headers: { 'x-ai-key': aiKey, 'x-github-token': githubToken } });

      const aiRes = res.data.response;
      const planMatch = aiRes.match(/\[\[\[([\s\S]*?)\]\]\]/);

      if (planMatch) {
        try {
          let planData = JSON.parse(planMatch[1]);
          const finalPlan = Array.isArray(planData) ? planData : [planData];
          setPendingPlan(finalPlan);
          const cleanText = aiRes.replace(/\[\[\[[\s\S]*?\]\]\]/, '').trim();
          setMessages(prev => [...prev, { role: 'bot', text: cleanText, hasPlan: true, plan: finalPlan }]);
        } catch (e) {
          setMessages(prev => [...prev, { role: 'bot', text: aiRes }]);
        }
      } else {
        setMessages(prev => [...prev, { role: 'bot', text: aiRes }]);
      }
    } catch (e) {
      const errorMsg = e.response?.data?.error || e.message;
      setMessages(prev => [...prev, { role: 'bot', text: `❌ שגיאה: ${errorMsg}` }]);
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

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{
      maxWidth: '600px', margin: '0 auto',
      height: '100dvh', display: 'flex', flexDirection: 'column',
      background: '#f1f5f9', overflow: 'hidden'
    }} dir="rtl">

      {/* Header */}
      <div style={{
        padding: '10px 14px', background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0
      }}>
        <div>
          <h1 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0 }}>AI Coding Agent 🤖</h1>
          <div style={{ fontSize: '11px', color: '#3b82f6', fontWeight: '600' }}>
            {selectedRepo || 'בחר פרויקט...'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
          <Tooltip text={RESPONSE_LENGTHS[responseLength].label}>
            <button style={iconBtn} onClick={cycleResponseLength}>
              {RESPONSE_LENGTHS[responseLength].icon}
            </button>
          </Tooltip>
          <Tooltip text="עזרה / README">
            <button style={iconBtn} onClick={fetchReadme}>❓</button>
          </Tooltip>
          <Tooltip text="מפת פרויקט">
            <button style={iconBtn} onClick={fetchProjectMap}>🗺️</button>
          </Tooltip>
          <Tooltip text="הגדרות">
            <button style={{ ...iconBtn, color: '#64748b' }} onClick={() => setShowSettings(true)}>
              <Settings size={18} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Chat */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
            <div style={{
              maxWidth: '90%', padding: '10px 14px', borderRadius: '14px',
              background: m.role === 'user' ? '#3b82f6' : '#e2e8f0',
              color: m.role === 'user' ? '#fff' : '#1e293b',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              border: m.role === 'user' ? 'none' : '1px solid #cbd5e1',
              fontSize: '14px', lineHeight: '1.5'
            }}>
              {m.role === 'bot' && <span style={{ marginLeft: '6px' }}>🤖</span>}
              {formatMessage(m.text)}

              {m.hasPlan && m.plan && (
                <div style={{ marginTop: '10px', borderTop: '1px solid #cbd5e1', paddingTop: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '6px' }}>📁 קבצים לשינוי:</div>
                  <ul style={{ fontSize: '11px', margin: '0 0 10px 0', paddingRight: '16px', listStyleType: 'disc' }}>
                    {m.plan.map((action, idx) => (
                      action.affectedFiles?.map((file, fi) => (
                        <li key={`${idx}-${fi}`}>
                          <code style={{ background: '#f8fafc', padding: '1px 4px', borderRadius: '3px' }}>{file}</code>
                        </li>
                      ))
                    ))}
                  </ul>
                  <button onClick={executePlan} style={{
                    width: '100%', padding: '9px', background: '#10b981', color: '#fff',
                    border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    fontSize: '13px'
                  }}>
                    <CheckCircle2 size={16} /> אשר ביצוע בגיט
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', marginBottom: '12px' }}>
            <div style={{
              padding: '10px 14px', borderRadius: '14px',
              background: '#e2e8f0', color: '#1e293b',
              border: '1px solid #cbd5e1',
              display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px'
            }}>
              <span>🤖</span>
              <Loader2 className="animate-spin" size={15} />
              <span>חושב...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '10px 12px', background: '#fff',
        borderTop: '1px solid #e2e8f0',
        display: 'flex', gap: '8px', flexShrink: 0
      }}>
        <input
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && sendMessage()}
          placeholder="מה נבנה עכשיו?"
          style={{
            flex: 1, padding: '10px 12px', borderRadius: '10px',
            border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px'
          }}
        />
        <button onClick={sendMessage} disabled={loading} style={{
          background: loading ? '#94a3b8' : '#3b82f6', color: '#fff',
          border: 'none', padding: '10px 12px', borderRadius: '10px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}>
          <Send size={18} />
        </button>
      </div>

      {/* ── Settings Modal ── */}
      {showSettings && (
        <div style={modalOverlay} onClick={() => setShowSettings(false)}>
          <div style={modalCard()} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px', overflowY: 'auto' }}>
              <X onClick={() => setShowSettings(false)} style={{
                position: 'absolute', left: '14px', top: '14px',
                cursor: 'pointer', color: '#94a3b8'
              }} size={22} />
              <h2 style={{ marginTop: 0, fontSize: '17px', marginBottom: '18px' }}>הגדרות חיבור</h2>
              <label style={labelStyle}>Gemini API Key</label>
              <input type="password" value={aiKey} onChange={e => setAiKey(e.target.value)}
                style={modalInputStyle} placeholder="הדבק מפתח גמיני..." />
              <label style={labelStyle}>GitHub Token</label>
              <input type="password" value={githubToken} onChange={e => setGithubToken(e.target.value)}
                style={modalInputStyle} placeholder="הדבק טוקן גיטהאב..." />
              {owner && (
                <div style={{ fontSize: '13px', marginBottom: '13px', color: '#10b981', fontWeight: '600' }}>
                  ✅ מחובר כ: {owner}
                </div>
              )}
              <label style={labelStyle}>בחר פרויקט פעיל</label>
              <select value={selectedRepo} onChange={e => setSelectedRepo(e.target.value)} style={modalInputStyle}>
                {repoList.length === 0 && <option>ממתין לטוקן...</option>}
                {repoList.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button onClick={() => setShowSettings(false)} style={{
                width: '100%', padding: '13px', background: '#3b82f6', color: '#fff',
                border: 'none', borderRadius: '10px', fontWeight: 'bold',
                cursor: 'pointer', fontSize: '15px'
              }}>
                שמור וצא
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── README Modal ── */}
      {showReadme && (
        <div style={modalOverlay} onClick={() => setShowReadme(false)}>
          <div style={modalCard('560px', '85vh')} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '14px 18px', borderBottom: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexShrink: 0
            }}>
              <span style={{ fontWeight: 'bold', fontSize: '15px' }}>📄 README — {selectedRepo}</span>
              <X onClick={() => setShowReadme(false)} style={{ cursor: 'pointer', color: '#94a3b8' }} size={20} />
            </div>
            <div style={{ padding: '16px 18px', overflowY: 'auto', direction: 'ltr' }}>
              {readmeLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '30px' }}>
                  <Loader2 className="animate-spin" size={24} color="#64748b" />
                </div>
              ) : (
                <pre style={{
                  margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit',
                  fontSize: '13px', lineHeight: '1.6', color: '#1e293b'
                }}>
                  {readmeContent}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Project Map Modal ── */}
      {showMap && (
        <div style={modalOverlay} onClick={() => { setShowMap(false); setSelectedMapFile(null); }}>
          <div style={modalCard('560px', '85vh')} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '14px 18px', borderBottom: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexShrink: 0
            }}>
              <span style={{ fontWeight: 'bold', fontSize: '15px' }}>🗺️ מפת פרויקט — {selectedRepo}</span>
              <X onClick={() => { setShowMap(false); setSelectedMapFile(null); }}
                style={{ cursor: 'pointer', color: '#94a3b8' }} size={20} />
            </div>

            <div style={{ padding: '14px 18px', overflowY: 'auto', flex: 1 }}>
              {mapLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '30px' }}>
                  <Loader2 className="animate-spin" size={24} color="#64748b" />
                </div>
              ) : !mapData ? (
                <p style={{ color: '#64748b', textAlign: 'center' }}>
                  לא נמצא קובץ project_map.json בפרויקט זה.
                </p>
              ) : (
                <>
                  {mapData.summary && (
                    <p style={{ fontSize: '13px', color: '#475569', marginBottom: '12px', marginTop: 0 }}>
                      {mapData.summary}
                    </p>
                  )}
                  {mapData.tech_stack?.length > 0 && (
                    <div style={{ marginBottom: '14px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {mapData.tech_stack.map((t, i) => (
                        <span key={i} style={{
                          background: '#eff6ff', color: '#3b82f6',
                          padding: '2px 8px', borderRadius: '99px',
                          fontSize: '11px', fontWeight: '600'
                        }}>{t}</span>
                      ))}
                    </div>
                  )}

                  {Object.entries(groupByDir(mapData.files)).map(([dir, paths]) => (
                    <div key={dir} style={{ marginBottom: '10px' }}>
                      <div style={{
                        fontSize: '11px', fontWeight: '700', color: '#64748b',
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                        marginBottom: '4px', direction: 'ltr'
                      }}>
                        {dir}/
                      </div>
                      {paths.map(path => (
                        <button key={path} onClick={() => setSelectedMapFile(path)}
                          style={{
                            display: 'block', width: '100%', textAlign: 'left',
                            background: selectedMapFile === path ? '#eff6ff' : 'transparent',
                            border: 'none', cursor: 'pointer',
                            padding: '5px 8px', borderRadius: '6px',
                            fontSize: '12px', fontFamily: 'monospace',
                            color: '#1e293b', direction: 'ltr',
                            marginBottom: '1px',
                            transition: 'background 0.1s'
                          }}
                          onMouseEnter={e => { if (selectedMapFile !== path) e.currentTarget.style.background = '#f8fafc'; }}
                          onMouseLeave={e => { if (selectedMapFile !== path) e.currentTarget.style.background = 'transparent'; }}
                        >
                          📄 {path.split('/').pop()}
                          <span style={{ color: '#94a3b8', fontSize: '11px', marginRight: '4px' }}>
                            {path.includes('/') ? ` (${path})` : ''}
                          </span>
                        </button>
                      ))}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── File Description Popup ── */}
      {showMap && selectedMapFile && mapData && (
        <div style={{
          position: 'fixed', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1100, padding: '20px',
          pointerEvents: 'none'
        }}>
          <div style={{
            background: '#fff', borderRadius: '12px', padding: '16px 18px',
            maxWidth: '360px', width: '100%',
            boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
            border: '1px solid #e2e8f0',
            pointerEvents: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <code style={{
                fontSize: '12px', color: '#3b82f6',
                background: '#eff6ff', padding: '2px 6px', borderRadius: '4px',
                wordBreak: 'break-all'
              }}>
                {selectedMapFile}
              </code>
              <button onClick={() => setSelectedMapFile(null)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#94a3b8', marginRight: '8px', flexShrink: 0
              }}>
                <X size={16} />
              </button>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>
              {mapData.files[selectedMapFile] || 'אין תיאור זמין לקובץ זה.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
