import React, { useState } from 'react';
import { 
  X, Key, Cpu, Zap, Brain, MessageSquare, RefreshCw, Search, 
  Moon, Save, Type, Upload, FileArchive, FileText, Database, Shield, ChevronLeft
} from 'lucide-react';
import { modalOverlay, modalCard, labelStyle, modalInputStyle } from '../../utils/theme';

const Toggle = ({ checked, onChange }) => (
  <div 
    onClick={() => onChange(!checked)}
    style={{
      width: '44px',
      height: '22px',
      backgroundColor: checked ? '#3b82f6' : '#334155',
      borderRadius: '12px',
      position: 'relative',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 4px'
    }}
  >
    <div style={{
      width: '16px',
      height: '16px',
      backgroundColor: '#fff',
      borderRadius: '50%',
      position: 'absolute',
      right: checked ? '24px' : '4px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    }} />
  </div>
);

const ConnectionInput = ({ icon: Icon, value, onChange, placeholder, type = "password" }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      background: focused ? '#1e293b' : '#1a2234',
      border: `1px solid ${focused ? '#3b82f6' : '#334155'}`,
      borderRadius: '10px',
      padding: '2px 12px',
      transition: 'all 0.2s ease'
    }}>
      <Icon size={18} color={focused ? '#3b82f6' : '#64748b'} />
      <input 
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#f8fafc',
          padding: '10px 0',
          width: '100%',
          outline: 'none',
          fontSize: '14px'
        }}
      />
    </div>
  );
};

const ToolButton = ({ icon: Icon, children, fullWidth }) => {
  const [hover, setHover] = useState(false);
  return (
    <button 
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: '12px',
        background: hover ? 'rgba(59, 130, 246, 0.1)' : 'rgba(30, 41, 59, 0.5)',
        border: `1px solid ${hover ? '#3b82f6' : '#334155'}`,
        borderRadius: '10px',
        color: hover ? '#60a5fa' : '#cbd5e1',
        cursor: 'pointer',
        fontSize: '13px',
        transition: 'all 0.2s ease',
        gridColumn: fullWidth ? 'span 2' : 'auto',
        fontWeight: '500'
      }}
    >
      <Icon size={16} />
      {children}
    </button>
  );
};

export function SettingsModal({ aiKey, setAiKey, githubToken, setGithubToken, owner, onClose }) {
  const [settings, setSettings] = useState({
    agentMode: true,
    memory: true,
    responseLength: 'medium',
    maxRetries: 3,
    deepScan: false,
    darkMode: true,
    autoSave: true,
    fontSize: '14px'
  });

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const sectionHeaderStyle = {
    fontSize: '13px',
    fontWeight: '700',
    color: '#3b82f6',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginTop: '28px',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    paddingBottom: '8px',
    borderBottom: '1px solid rgba(59, 130, 246, 0.1)'
  };

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.03)'
  };

  const rowLabelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '14px',
    color: '#e2e8f0',
    fontWeight: '500'
  };

  const selectStyle = {
    background: '#1e293b',
    color: '#f8fafc',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '6px 10px',
    fontSize: '13px',
    outline: 'none',
    cursor: 'pointer'
  };

  return (
    <div style={{ ...modalOverlay, direction: 'rtl', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div 
        style={{ 
          ...modalCard(), 
          backgroundColor: '#0f172a',
          width: '520px', 
          maxWidth: '95vw', 
          maxHeight: '90vh', 
          overflow: 'hidden', 
          display: 'flex', 
          flexDirection: 'column',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }} 
        onClick={e => e.stopPropagation()}
      >
        
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'relative', background: 'rgba(255,255,255,0.02)' }}>
          <X onClick={onClose} style={{ position: 'absolute', left: '24px', top: '26px', cursor: 'pointer', color: '#64748b', transition: 'color 0.2s' }} size={22} />
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#f8fafc', letterSpacing: '-0.025em' }}>הגדרות מערכת</h2>
        </div>

        <div style={{ padding: '8px 24px 24px 24px', overflowY: 'auto', flex: 1 }}>
          
          <div style={sectionHeaderStyle}><Database size={16} /> חיבור ומפתחות גישה</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ ...rowLabelStyle, marginBottom: '8px', fontSize: '13px', color: '#94a3b8' }}>Gemini API Key</div>
              <ConnectionInput 
                icon={Key} 
                value={aiKey} 
                onChange={e => setAiKey(e.target.value)} 
                placeholder="הכנס מפתח גמיני..." 
              />
            </div>
            <div>
              <div style={{ ...rowLabelStyle, marginBottom: '8px', fontSize: '13px', color: '#94a3b8' }}>GitHub Token</div>
              <ConnectionInput 
                icon={Shield} 
                value={githubToken} 
                onChange={e => setGithubToken(e.target.value)} 
                placeholder="הכנס טוקן גיטהאב..." 
              />
            </div>
          </div>

          {owner && (
            <div style={{ 
              marginTop: '16px',
              padding: '12px',
              background: 'rgba(16, 185, 129, 0.05)',
              borderRadius: '8px',
              fontSize: '13px', 
              color: '#34d399', 
              fontWeight: '600', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px',
              border: '1px solid rgba(16, 185, 129, 0.1)'
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></div>
              מחובר כ: {owner}
            </div>
          )}

          <div style={sectionHeaderStyle}><Cpu size={16} /> הגדרות בינה מלאכותית</div>
          
          <div style={rowStyle}>
            <div style={rowLabelStyle}><Zap size={18} color="#64748b" /> מצב סוכן (Agent Mode)</div>
            <Toggle checked={settings.agentMode} onChange={() => toggleSetting('agentMode')} />
          </div>

          <div style={rowStyle}>
            <div style={rowLabelStyle}><Brain size={18} color="#64748b" /> זיכרון הקשר ארוך</div>
            <Toggle checked={settings.memory} onChange={() => toggleSetting('memory')} />
          </div>

          <div style={rowStyle}>
            <div style={rowLabelStyle}><MessageSquare size={18} color="#64748b" /> אורך תגובה מקסימלי</div>
            <select style={selectStyle} value={settings.responseLength} onChange={(e) => updateSetting('responseLength', e.target.value)}>
              <option value="short">תמציתי</option>
              <option value="medium">מאוזן</option>
              <option value="long">מפורט</option>
            </select>
          </div>

          <div style={rowStyle}>
            <div style={rowLabelStyle}><RefreshCw size={18} color="#64748b" /> ניסיונות קריאה חוזרים</div>
            <input type="number" style={{ ...selectStyle, width: '50px' }} value={settings.maxRetries} onChange={(e) => updateSetting('maxRetries', e.target.value)} />
          </div>

          <div style={rowStyle}>
            <div style={rowLabelStyle}><Search size={18} color="#64748b" /> סריקת קבצים עמוקה</div>
            <Toggle checked={settings.deepScan} onChange={() => toggleSetting('deepScan')} />
          </div>

          <div style={sectionHeaderStyle}><Moon size={16} /> ממשק וחזותיות</div>
          
          <div style={rowStyle}>
            <div style={rowLabelStyle}><Moon size={18} color="#64748b" /> מצב כהה (Dark Mode)</div>
            <Toggle checked={settings.darkMode} onChange={() => toggleSetting('darkMode')} />
          </div>

          <div style={rowStyle}>
            <div style={rowLabelStyle}><Save size={18} color="#64748b" /> שמירה אוטומטית</div>
            <Toggle checked={settings.autoSave} onChange={() => toggleSetting('autoSave')} />
          </div>

          <div style={rowStyle}>
            <div style={rowLabelStyle}><Type size={18} color="#64748b" /> גודל גופן קוד</div>
            <select style={selectStyle} value={settings.fontSize} onChange={(e) => updateSetting('fontSize', e.target.value)}>
              <option value="12px">קטן</option>
              <option value="14px">בינוני</option>
              <option value="16px">גדול</option>
            </select>
          </div>

          <div style={sectionHeaderStyle}><FileArchive size={16} /> כלים מתקדמים</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' }}>
            <ToolButton icon={Upload}>טעינת צ'אט</ToolButton>
            <ToolButton icon={FileArchive}>דחיסת פרויקט</ToolButton>
            <ToolButton icon={FileText} fullWidth>קרא README.md</ToolButton>
          </div>

          <button onClick={onClose} style={{
            width: '100%', padding: '16px', background: '#3b82f6', color: '#fff',
            border: 'none', borderRadius: '12px', fontWeight: '700',
            cursor: 'pointer', fontSize: '15px', marginTop: '32px',
            boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.4)',
            transition: 'transform 0.2s, background-color 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = '#2563eb'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = '#3b82f6'}
          >
            שמור וסגור הגדרות <ChevronLeft size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}