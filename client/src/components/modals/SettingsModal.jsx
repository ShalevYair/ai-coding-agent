import React from 'react';
import { X } from 'lucide-react';
import { modalOverlay, modalCard, labelStyle, modalInputStyle } from '../../utils/theme';

export function SettingsModal({ aiKey, setAiKey, githubToken, setGithubToken, owner, onClose }) {
  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalCard()} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px', overflowY: 'auto' }}>
          <X onClick={onClose} style={{ position: 'absolute', left: '14px', top: '14px', cursor: 'pointer', color: '#94a3b8' }} size={22} />
          <h2 style={{ marginTop: 0, fontSize: '17px', marginBottom: '18px' }}>הגדרות חיבור</h2>

          <label style={labelStyle}>Gemini API Key</label>
          <input type="password" value={aiKey} onChange={e => setAiKey(e.target.value)}
            style={modalInputStyle} placeholder="הדבק מפתח גמיני..." />

          <label style={labelStyle}>GitHub Token</label>
          <input type="password" value={githubToken} onChange={e => setGithubToken(e.target.value)}
            style={modalInputStyle} placeholder="הדבק טוקן גיטהאב..." />

          {owner && (
            <div style={{ fontSize: '13px', marginBottom: '16px', color: '#10b981', fontWeight: '600' }}>
              ✅ מחובר כ: {owner}
            </div>
          )}

          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
            לבחירת פרויקט — השתמש בכפתור 📁 בתפריט הצד.
          </p>

          <button onClick={onClose} style={{
            width: '100%', padding: '13px', background: '#3b82f6', color: '#fff',
            border: 'none', borderRadius: '10px', fontWeight: 'bold',
            cursor: 'pointer', fontSize: '15px'
          }}>
            שמור וצא
          </button>
        </div>
      </div>
    </div>
  );
}
