import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { formatMessage } from '../utils/formatMessage';

export function MessageBubble({ message: m, fontSize, executePlan, fetchPreview, answerAsk, currentMessages, isExecuting }) {
  const [expandedFiles, setExpandedFiles] = useState({});
  const [expandedFunctions, setExpandedFunctions] = useState({});

  const toggleFile = (file) => {
    setExpandedFiles(prev => ({ ...prev, [file]: !prev[file] }));
  };

  const toggleFunction = (fnKey) => {
    setExpandedFunctions(prev => ({ ...prev, [fnKey]: !prev[fnKey] }));
  };

  return (
    <div style={{
      maxWidth: '90%', padding: m.role === 'user' ? '10px 14px' : '10px 0', borderRadius: '14px',
      background: m.role === 'user' ? '#3b82f6' : 'transparent',
      color: m.role === 'user' ? '#fff' : '#1e293b',
      boxShadow: m.role === 'user' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
      border: 'none',
      fontSize: `${fontSize}px`, lineHeight: '1.6'
    }}>
      {formatMessage(m.text, m.role === 'user')}

      {m.hasAsk && m.askData && (
        <div style={{ marginTop: '10px', borderTop: '1px solid #cbd5e1', paddingTop: '8px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', fontWeight: '600' }}>
            🤔 {m.askData.question}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {(m.askData.options || []).map((opt, idx) => (
              <button key={idx} onClick={() => answerAsk(opt, currentMessages, m.askData)} style={{
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
            {m.plan.map((action, idx) =>
              action.affectedFiles?.map((file, fi) => {
                const isFileExpanded = !!expandedFiles[file];
                return (
                  <div key={`${idx}-${fi}`} style={{ border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                    <div
                      onClick={() => toggleFile(file)}
                      style={{
                        cursor: 'pointer', background: '#f8fafc', padding: '4px 8px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}
                    >
                      <code style={{ fontSize: '11px', fontWeight: '600' }}>{file}</code>
                      <span style={{ fontSize: '10px' }}>{isFileExpanded ? '▼' : '▶'}</span>
                    </div>
                    {isFileExpanded && action.details?.filter(d => d.file === file).map((detail, di) => (
                      <div key={di} style={{ padding: '6px', background: '#fff', borderTop: '1px solid #e2e8f0' }}>
                        {detail.functions?.map((fn, fni) => {
                          const fnKey = `${file}-${fn.name}`;
                          const isFnExpanded = !!expandedFunctions[fnKey];
                          return (
                            <div key={fni} style={{ marginBottom: '4px' }}>
                              <div
                                onClick={() => toggleFunction(fnKey)}
                                style={{ cursor: 'pointer', fontSize: '11px', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <span>{isFnExpanded ? '📂' : '📁'}</span>
                                <span style={{ textDecoration: 'underline' }}>{fn.name}</span>
                              </div>
                              {isFnExpanded && (
                                <div style={{
                                  marginTop: '4px', fontSize: '10px', fontFamily: 'monospace',
                                  border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden',
                                  direction: 'ltr', textAlign: 'left'
                                }}>
                                  <div style={{ background: '#fee2e2', color: '#991b1b', padding: '6px', whiteSpace: 'pre-wrap' }}>
                                    - {fn.oldCode || '// empty'}
                                  </div>
                                  <div style={{ background: '#dcfce7', color: '#166534', padding: '6px', whiteSpace: 'pre-wrap', borderTop: '1px solid #bcf0d3' }}>
                                    + {fn.newCode}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => fetchPreview(m.plan)} style={{
              flex: 1, padding: '9px', background: '#fff', color: '#475569',
              border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '600',
              cursor: 'pointer', fontSize: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
            }}>
              👁️ תצוגה מקדימה
            </button>
            <button 
              onClick={executePlan} 
              disabled={isExecuting}
              style={{
                flex: 1, padding: '9px', background: isExecuting ? '#94a3b8' : '#10b981', color: '#fff',
                border: 'none', borderRadius: '8px', fontWeight: 'bold', 
                cursor: isExecuting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                fontSize: '12px'
              }}>
              <CheckCircle2 size={20} /> {isExecuting ? 'מבצע...' : 'אשר ביצוע'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}