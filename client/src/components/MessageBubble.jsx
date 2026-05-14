import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { formatMessage } from '../utils/formatMessage';

export function MessageBubble({ message: m, fontSize, executePlan, fetchPreview, answerAsk, currentMessages }) {
  return (
    <div style={{
      maxWidth: '90%', padding: '10px 14px', borderRadius: '14px',
      background: m.role === 'user' ? '#3b82f6' : '#e2e8f0',
      color: m.role === 'user' ? '#fff' : '#1e293b',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      border: m.role === 'user' ? 'none' : '1px solid #cbd5e1',
      fontSize: `${fontSize}px`, lineHeight: '1.6'
    }}>
      {m.role === 'bot' && <span style={{ marginLeft: '6px' }}>🤖</span>}
      {formatMessage(m.text)}

      {m.hasAsk && m.askData && (
        <div style={{ marginTop: '10px', borderTop: '1px solid #cbd5e1', paddingTop: '8px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', fontWeight: '600' }}>
            🤔 {m.askData.question}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {(m.askData.options || []).map((opt, idx) => (
              <button key={idx} onClick={() => answerAsk(opt, currentMessages)} style={{
                padding: '7px 10px', background: '#fff', color: '#1e293b',
                border: '1px solid #cbd5e1', borderRadius: '8px',
                cursor: 'pointer', fontSize: '12px', textAlign: 'right',
                fontFamily: 'monospace', direction: 'ltr'
              }}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {m.hasPlan && m.plan && (
        <div style={{ marginTop: '10px', borderTop: '1px solid #cbd5e1', paddingTop: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '6px' }}>📁 קבצים לשינוי:</div>
          <ul style={{ fontSize: '11px', margin: '0 0 10px 0', paddingRight: '16px', listStyleType: 'disc' }}>
            {m.plan.map((action, idx) =>
              action.affectedFiles?.map((file, fi) => (
                <li key={`${idx}-${fi}`}>
                  <code style={{ background: '#f8fafc', padding: '1px 4px', borderRadius: '3px' }}>{file}</code>
                </li>
              ))
            )}
          </ul>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => fetchPreview(m.plan)} style={{
              flex: 1, padding: '9px', background: '#fff', color: '#475569',
              border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '600',
              cursor: 'pointer', fontSize: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
            }}>
              👁️ תצוגה מקדימה
            </button>
            <button onClick={executePlan} style={{
              flex: 1, padding: '9px', background: '#10b981', color: '#fff',
              border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
              fontSize: '12px'
            }}>
              <CheckCircle2 size={15} /> אשר ביצוע
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
