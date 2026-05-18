import React, { useState } from 'react';
import { 
  X, Key, Cpu, Zap, Brain, MessageSquare, RefreshCw, Search, 
  Moon, Save, Type, Upload, FileArchive, FileText, Database, Shield
} from 'lucide-react';
import { modalOverlay, modalCard, labelStyle, modalInputStyle } from '../../utils/theme';

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
    fontSize: '14px',
    fontWeight: '700',
    color: '#94a3b8',
    marginTop: '24px',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
    paddingBottom: '8px'
  };

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.03)'
  };

  const rowLabelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '14px',
    color: '#e2e8f0'
  };

  const iconColor = "#64748b";

  const toolButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: '#cbd5e1',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.2s'
  };

  const selectStyle = {
    background: '#1e293b',
    color: '#fff',
    border: '1px solid #334155',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '13px',
    outline: 'none'
  };

  return (
    <div style={{ ...modalOverlay, direction: 'rtl' }} onClick={onClose}>
      <div style={{ ...modalCard(), width: '480px', maxWidth: '95vw', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
          <X onClick={onClose} style={{ position: 'absolute', left: '20px', top: '22px', cursor: 'pointer', color: '#94a3b8' }} size={20} />
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>הגדרות מערכת</h2>
        </div>

        <div style={{ padding: '0 24px 24px 24px', overflowY: 'auto', flex: 1 }}>
          
          {/* Connection Section */}
          <div style={sectionHeaderStyle}><Database size={16} /> חיבור ומפתחות</div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ ...rowLabelStyle, marginBottom: '8px' }}><Key size={14} color={iconColor} /> Gemini API Key</div>
            <input type="password" value={aiKey} onChange={e => setAiKey(e.target.value)}
              style={modalInputStyle} placeholder="הכנס מפתח גמיני..." />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ ...rowLabelStyle, marginBottom: '8px' }}><Shield size={14} color={iconColor} /> GitHub Token</div>
            <input type="password" value={githubToken} onChange={e => setGithubToken(e.target.value)}
              style={modalInputStyle} placeholder="הכנס טוקן גיטהאב..." />
          </div>
          {owner && (
            <div style={{ fontSize: '13px', color: '#10b981', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
              מחובר כ: {owner}
            </div>
          )}

          {/* AI Settings Section */}
          <div style={sectionHeaderStyle}><Cpu size={16} /> הגדרות בינה מלאכותית</div>
          
          <div style={rowStyle}>
            <div style={rowLabelStyle}><Zap size={18} color={iconColor} /> מצב סוכן (Agent Mode)</div>
            <input type="checkbox" checked={settings.agentMode} onChange={() => toggleSetting('agentMode')} />
          </div>

          <div style={rowStyle}>
            <div style={rowLabelStyle}><Brain size={18} color={iconColor} /> זיכרון הקשר ארוך</div>
            <input type="checkbox" checked={settings.memory} onChange={() => toggleSetting('memory')} />
          </div>

          <div style={rowStyle}>
            <div style={rowLabelStyle}><MessageSquare size={18} color={iconColor} /> אורך תגובה מקסימלי</div>
            <select style={selectStyle} value={settings.responseLength} onChange={(e) => updateSetting('responseLength', e.target.value)}>
              <option value="short">תמציתי</option>
              <option value="medium">מאוזן</option>
              <option value="long">מפורט</option>
            </select>
          </div>

          <div style={rowStyle}>
            <div style={rowLabelStyle}><RefreshCw size={18} color={iconColor} /> ניסיונות קריאה חוזרים</div>
            <input type="number" style={{ ...selectStyle, width: '45px' }} value={settings.maxRetries} onChange={(e) => updateSetting('maxRetries', e.target.value)} />
          </div>

          <div style={rowStyle}>
            <div style={rowLabelStyle}><Search size={18} color={iconColor} /> סריקת קבצים עמוקה</div>
            <input type="checkbox" checked={settings.deepScan} onChange={() => toggleSetting('deepScan')} />
          </div>

          {/* Interface Section */}
          <div style={sectionHeaderStyle}><Moon size={16} /> ממשק וחזותיות</div>
          
          <div style={rowStyle}>
            <div style={rowLabelStyle}><Moon size={18} color={iconColor} /> מצב כהה (Dark Mode)</div>
            <input type="checkbox" checked={settings.darkMode} onChange={() => toggleSetting('darkMode')} />
          </div>

          <div style={rowStyle}>
            <div style={rowLabelStyle}><Save size={18} color={iconColor} /> שמירה אוטומטית</div>
            <input type="checkbox" checked={settings.autoSave} onChange={() => toggleSetting('autoSave')} />
          </div>

          <div style={rowStyle}>
            <div style={rowLabelStyle}><Type size={18} color={iconColor} /> גודל גופן קוד</div>
            <select style={selectStyle} value={settings.fontSize} onChange={(e) => updateSetting('fontSize', e.target.value)}>
              <option value="12px">קטן</option>
              <option value="14px">בינוני</option>
              <option value="16px">גדול</option>
            </select>
          </div>

          {/* Tools Section */}
          <div style={sectionHeaderStyle}><FileArchive size={16} /> כלים מתקדמים</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
            <button style={toolButtonStyle}><Upload size={16} /> טעינת צ'אט</button>
            <button style={toolButtonStyle}><FileArchive size={16} /> דחיסת פרויקט</button>
            <button style={{ ...toolButtonStyle, gridColumn: 'span 2' }}><FileText size={16} /> קרא README</button>
          </div>

          <button onClick={onClose} style={{
            width: '100%', padding: '14px', background: '#3b82f6', color: '#fff',
            border: 'none', borderRadius: '12px', fontWeight: 'bold',
            cursor: 'pointer', fontSize: '15px', marginTop: '32px',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
          }}>
            שמור וסגור הגדרות
          </button>
        </div>
      </div>
    </div>
  );
}