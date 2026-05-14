import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { modalOverlay, modalCard } from '../../utils/theme';

export function SaveChatModal({ messages, saveLoading, onSave, onClose }) {
  const [saveType, setSaveType] = useState('full');
  const [result, setResult] = useState(null);

  const handleSave = async () => {
    const res = await onSave(messages, saveType);
    setResult(res);
  };

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={{ ...modalCard('420px', 'auto'), direction: 'rtl' }} onClick={e => e.stopPropagation()}>
        <div style={{
          padding: '14px 18px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <span style={{ fontWeight: 'bold', fontSize: '15px' }}>💾 שמירת שיחה</span>
          <X onClick={onClose} style={{ cursor: 'pointer', color: '#94a3b8' }} size={20} />
        </div>

        <div style={{ padding: '20px 18px' }}>
          {result ? (
            result.success ? (
              <div style={{ textAlign: 'center', color: '#10b981', fontWeight: '600' }}>
                ✅ השיחה נשמרה בהצלחה!<br />
                <span style={{ fontSize: '13px', color: '#475569', fontWeight: 'normal' }}>{result.title}</span>
              </div>
            ) : (
              <div style={{ color: '#ef4444' }}>❌ שגיאה: {result.error}</div>
            )
          ) : (
            <>
              <p style={{ margin: '0 0 16px', color: '#475569', fontSize: '14px' }}>
                כיצד לשמור את השיחה הנוכחית ({messages.length} הודעות)?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {[
                  { value: 'full', label: 'כל השיחה', desc: 'שמירת עשרת ההודעות האחרונות המלאות' },
                  { value: 'summary', label: 'סיכום בלבד', desc: 'AI יסכם את השיחה ויאחסן סיכום קצר' }
                ].map(opt => (
                  <label key={opt.value} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                    padding: '12px', borderRadius: '8px', cursor: 'pointer',
                    border: `2px solid ${saveType === opt.value ? '#3b82f6' : '#e2e8f0'}`,
                    background: saveType === opt.value ? '#eff6ff' : '#fff'
                  }}>
                    <input type="radio" name="saveType" value={opt.value}
                      checked={saveType === opt.value} onChange={() => setSaveType(opt.value)}
                      style={{ marginTop: '2px' }} />
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>{opt.label}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
              <button onClick={handleSave} disabled={saveLoading} style={{
                width: '100%', padding: '11px', background: saveLoading ? '#93c5fd' : '#3b82f6',
                color: '#fff', border: 'none', borderRadius: '8px',
                fontWeight: 'bold', cursor: saveLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px'
              }}>
                {saveLoading ? <><Loader2 className="animate-spin" size={16} /> שומר...</> : '💾 שמור'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
