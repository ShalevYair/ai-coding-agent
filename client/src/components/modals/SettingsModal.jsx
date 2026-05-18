import React, { useState } from 'react';
import { 
  X, Key, Cpu, Zap, Brain, MessageSquare, RefreshCw, Search, 
  Moon, Save, Type, Database, Shield, ChevronLeft
} from 'lucide-react';
import { modalOverlay, modalCard } from '../../utils/theme';

const Toggle = ({ checked, onChange }) => (
  <div 
    onClick={onChange}
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
      left: checked ? '24px' : '4px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    }} />
  </div>
);

const CycleButton = ({ value, onClick, labels }) => {
  const [hover, setHover] = useState(false);
  const displayValue = labels ? labels[value] : value;
  
  return (
    <button 
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? '#334155' : '#1e293b',
        color: '#f8fafc',
        border: '1px solid #334155',
        borderRadius: '8px',
        padding: '6px 14px',
        fontSize: '13px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        minWidth: '80px',
        textAlign: 'center',
        outline: 'none'
      }}
    >
      {displayValue}
    </button>
  );
};

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

export function SettingsModal({ 
  aiKey, setAiKey, 
  githubToken, setGithubToken, 
  owner, onClose,
  agentMode, cycleAgentMode,
  memoryMode, cycleMemoryMode,
  responseLength, cycleResponseLength,
  maxRetries, cycleMaxRetries,
  deepScanMode, toggleDeepScan,
  darkMode, toggleDarkMode,
  autoSave, toggleAutoSave,
  fontSize, cycleFontSize
}) {

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
          
          <div style={sectionHeaderStyle}><Cpu size={16} /> הגדרות בינה מלאכותית</div>
          
          <div style={rowStyle}>
            <div style={rowLabelStyle}><Zap size={18} color="#64748b" /> עומק מחשבה</div>
            <CycleButton
              value={agentMode}
              onClick={cycleAgentMode}
              labels={{ dove: '🕊️ רגיל', raven: '🐦 כפול', owl: '🦉 משולש' }}
            />
          </div>

          <div style={rowStyle}>
            <div style={rowLabelStyle}><Brain size={18} color="#64748b" /> זיכרון הקשר ארוך</div>
            <CycleButton 
              value={memoryMode} 
              onClick={cycleMemoryMode} 
              labels={{ cat: '🐱 קצר', elephant: '🐘 ארוך', goldfish: '🐟 מינימלי' }} 
            />
          </div>

          <div style={rowStyle}>
            <div style={rowLabelStyle}><MessageSquare size={18} color="#64748b" /> אורך תשובה</div>
            <CycleButton 
              value={responseLength} 
              onClick={cycleResponseLength} 
              labels={{ short: 'תמציתי', normal: 'מאוזן', long: 'מפורט' }} 
            />
          </div>

          <div style={rowStyle}>
            <div style={rowLabelStyle}><RefreshCw size={18} color="#64748b" /> ניסיונות תיקון מקס'</div>
            <CycleButton 
              value={maxRetries} 
              onClick={cycleMaxRetries} 
            />
          </div>

          <div style={rowStyle}>
            <div style={rowLabelStyle}><Search size={18} color="#64748b" /> סריקת קבצים עמוקה</div>
            <Toggle checked={deepScanMode} onChange={toggleDeepScan} />
          </div>

          <div style={sectionHeaderStyle}><Moon size={16} /> ממשק וחזותיות</div>
          
          <div style={rowStyle}>
            <div style={rowLabelStyle}><Moon size={18} color="#64748b" /> מצב כהה (Dark Mode)</div>
            <Toggle checked={darkMode} onChange={toggleDarkMode} />
          </div>

          <div style={rowStyle}>
            <div style={rowLabelStyle}><Save size={18} color="#64748b" /> שמירה אוטומטית</div>
            <Toggle checked={autoSave} onChange={toggleAutoSave} />
          </div>

          <div style={rowStyle}>
            <div style={rowLabelStyle}><Type size={18} color="#64748b" /> גודל גופן קוד</div>
            <CycleButton 
              value={fontSize} 
              onClick={cycleFontSize} 
              labels={{ 12: 'קטן', 14: 'בינוני', 16: 'גדול' }} 
            />
          </div>

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