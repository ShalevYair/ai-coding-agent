import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, CheckCircle2, Settings, RefreshCw } from 'lucide-react';

const App = () => {
  // הגדרות וסטייט
  const [aiKey, setAiKey] = useState(localStorage.getItem('ai-key') || '');
  const [githubToken, setGithubToken] = useState(localStorage.getItem('github-token') || '');
  const [owner, setOwner] = useState('');
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [prompt, setPrompt] = useState('בנה דף נחיתה פשוט עם כותרת וכפתור');
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [fetchingRepos, setFetchingRepos] = useState(false);

  // שמירת מפתחות וטעינת נתונים מגיטהאב
  useEffect(() => {
    localStorage.setItem('ai-key', aiKey);
    localStorage.setItem('github-token', githubToken);
    if (githubToken && githubToken.startsWith('ghp_')) {
      fetchGitHubData();
    }
  }, [githubToken, aiKey]);

  const fetchGitHubData = async () => {
    setFetchingRepos(true);
    try {
      const res = await axios.get('/api/user/repos', { 
        headers: { 'x-github-token': githubToken, 'x-ai-key': aiKey } 
      });
      setOwner(res.data.owner);
      setRepos(res.data.repos);
      if (res.data.repos.length > 0 && !selectedRepo) {
        setSelectedRepo(res.data.repos[0]);
      }
    } catch (err) {
      console.error("נכשל במשיכת רפוזיטוריז");
    }
    setFetchingRepos(false);
  };

  // 1. יצירת תוכנית עבודה
  const generatePlan = async () => {
    if (!aiKey || !githubToken || !selectedRepo) {
      alert("נא לוודא שכל השדות וההגדרות מלאים");
      return;
    }
    setLoading(true);
    setPlan(null);
    setCurrentStep(-1);
    try {
      const res = await axios.post('/api/plan', 
        { prompt, owner, repo: selectedRepo }, 
        { headers: { 'x-ai-key': aiKey, 'x-github-token': githubToken } }
      );
      setPlan(res.data.plan);
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      alert(`שגיאה ביצירת תוכנית: ${msg}`);
    }
    setLoading(false);
  };

  // 2. ביצוע כל התוכנית ברצף
  const executeFullPlan = async () => {
    setExecuting(true);
    for (let i = 0; i < plan.length; i++) {
      setCurrentStep(i);
      try {
        await axios.post('/api/execute', {
          owner,
          repo: selectedRepo,
          filePath: plan[i].affectedFiles[0],
          instructions: plan[i].description
        }, { 
          headers: { 'x-ai-key': aiKey, 'x-github-token': githubToken } 
        });
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.message;
        alert(`❌ נכשל בשלב ${i + 1}:\n${errorMsg}`);
        setExecuting(false);
        return; // עוצר את הביצוע אם יש שגיאה
      }
    }
    setExecuting(false);
    setCurrentStep(plan.length); // מסמן שכל השלבים הושלמו
    alert("🚀 הצלחה! הסוכן סיים לבנות ולעדכן את כל הקבצים בגיטהאב.");
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto', direction: 'rtl' }}>
      <h1 style={{ textAlign: 'center' }}>🤖 AI Coding Agent</h1>

      {/* הגדרות */}
      <section style={{ background: '#f1f5f9', padding: '15px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ marginTop: 0 }}><Settings size={18} /> חיבורים</h3>
        <input 
          type="password" 
          placeholder="Gemini API Key" 
          value={aiKey} 
          onChange={e => setAiKey(e.target.value)} 
          style={{ width: '95%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #cbd5e1' }} 
        />
        <input 
          type="password" 
          placeholder="GitHub Token (ghp_...)" 
          value={githubToken} 
          onChange={e => setGithubToken(e.target.value)} 
          style={{ width: '95%', padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1' }} 
        />
      </section>

      {/* בחירת פרויקט */}
      {owner && (
        <div style={{ marginBottom: '20px', padding: '10px', background: '#f0fdf4', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span><strong>מחובר כ:</strong> {owner}</span>
          <div>
            <select value={selectedRepo} onChange={e => setSelectedRepo(e.target.value)} style={{ padding: '5px', borderRadius: '4px' }}>
              {repos.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <button onClick={fetchGitHubData} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '5px' }}>
              <RefreshCw size={16} className={fetchingRepos ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      )}

      {/* קלט AI */}
      <textarea 
        value={prompt} 
        onChange={e => setPrompt(e.target.value)} 
        placeholder="מה תרצה לבנות?"
        style={{ width: '100%', height: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '10px', boxSizing: 'border-box' }} 
      />
      
      <button 
        onClick={generatePlan} 
        disabled={loading || executing} 
        style={{ width: '100%', padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
      >
        {loading ? <Loader2 className="animate-spin" style={{margin:'0 auto'}} /> : "הכן תוכנית עבודה 📋"}
      </button>

      {/* תוכנית עבודה וביצוע */}
      {plan && (
        <div style={{ marginTop: '30px', borderTop: '2px solid #e2e8f0', paddingTop: '20px' }}>
          <h3>📋 שלבי הביצוע:</h3>
          {plan.map((step, index) => (
            <div key={index} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '12px', 
              background: index === currentStep ? '#eff6ff' : 'white', 
              border: '1px solid #e2e8f0', 
              borderRadius: '8px', 
              marginBottom: '10px' 
            }}>
              <div style={{ flex: 1 }}>
                <strong>{step.id}.</strong> {step.description}
                <div style={{ fontSize: '12px', color: '#64748b' }}>קובץ: {step.affectedFiles?.[0]}</div>
              </div>
              
              {index < currentStep || (currentStep === plan.length) ? (
                <CheckCircle2 color="#10b981" />
              ) : index === currentStep && executing ? (
                <Loader2 className="animate-spin" color="#2563eb" />
              ) : null}
            </div>
          ))}

          <button 
            onClick={executeFullPlan} 
            disabled={executing}
            style={{ 
              width: '100%', 
              marginTop: '20px', 
              padding: '15px', 
              background: '#059669', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              fontSize: '18px', 
              fontWeight: 'bold', 
              cursor: 'pointer' 
            }}
          >
            {executing ? "הסוכן עובד על הפרויקט... 🔨" : "🚀 בצע את כל התוכנית בגיטהאב!"}
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
