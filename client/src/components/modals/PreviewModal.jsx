import React from 'react';
import { X, Loader2, CheckCircle2 } from 'lucide-react';
import { modalOverlay, modalCard } from '../../utils/theme';

const getDiffHunks = (oldStr = '', newStr = '') => {
  const oldLines = (oldStr || '').split('\n');
  const newLines = (newStr || '').split('\n');
  const diff = [];
  let i = 0, j = 0;

  while (i < oldLines.length || j < newLines.length) {
    if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
      diff.push({ type: 'context', content: oldLines[i], oldLine: i + 1, newLine: j + 1 });
      i++; j++;
    } else if (i < oldLines.length && (j >= newLines.length || !newLines.slice(j, j + 15).includes(oldLines[i]))) {
      diff.push({ type: 'removed', content: oldLines[i], oldLine: i + 1, newLine: null });
      i++;
    } else {
      diff.push({ type: 'added', content: newLines[j], oldLine: null, newLine: j + 1 });
      j++;
    }
  }

  const hunks = [];
  const context = 3;
  let currentHunk = [];
  
  diff.forEach((line, idx) => {
    const hasNearbyChange = diff.slice(Math.max(0, idx - context), idx + context + 1).some(l => l.type !== 'context');
    if (hasNearbyChange) {
      currentHunk.push(line);
    } else if (currentHunk.length > 0) {
      hunks.push(currentHunk);
      currentHunk = [];
    }
  });
  if (currentHunk.length > 0) hunks.push(currentHunk);
  return hunks;
};

export function PreviewModal({ previewData, previewLoading, previewFileIdx, setPreviewFileIdx, previewTab, setPreviewTab, executePlan, onClose }) {
  const current = previewData[previewFileIdx];

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={{ ...modalCard('660px', '88vh'), direction: 'ltr' }} onClick={e => e.stopPropagation()}>
        <div style={{
          padding: '12px 16px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0, direction: 'rtl'
        }}>
          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>👁️ תצוגה מקדימה</span>
          <X onClick={onClose} style={{ cursor: 'pointer', color: '#94a3b8' }} size={20} />
        </div>

        {previewLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '10px', color: '#64748b' }}>
            <Loader2 className="animate-spin" size={22} />
            <span style={{ direction: 'rtl' }}>מפעיל AI לצפייה מקדימה...</span>
          </div>
        ) : (
          <>
            {previewData.length > 1 && (
              <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
                {previewData.map((p, i) => (
                  <button key={i} onClick={() => setPreviewFileIdx(i)} style={{
                    padding: '8px 14px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                    background: previewFileIdx === i ? '#fff' : '#f8fafc',
                    borderBottom: previewFileIdx === i ? '2px solid #3b82f6' : '2px solid transparent',
                    fontSize: '11px', fontFamily: 'JetBrains Mono, monospace',
                    color: previewFileIdx === i ? '#1d4ed8' : '#64748b'
                  }}>
                    {p.file}
                  </button>
                ))}
              </div>
            )}

            {current && (
              <>
                <div style={{
                  padding: '8px 14px', background: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0', flexShrink: 0,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <code style={{ fontSize: '11px', color: '#475569' }}>{current.file}</code>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {['diff', 'before', 'after'].map(tab => (
                      <button key={tab} onClick={() => setPreviewTab(tab)} style={{
                        padding: '3px 10px', fontSize: '11px', cursor: 'pointer',
                        borderRadius: '5px', border: '1px solid #e2e8f0',
                        background: previewTab === tab ? '#3b82f6' : '#fff',
                        color: previewTab === tab ? '#fff' : '#64748b'
                      }}>
                        {tab === 'diff' ? 'שינויים' : tab === 'before' ? 'לפני' : 'אחרי'}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', background: '#1e293b' }}>
                  {previewTab === 'diff' ? (
                    <div style={{ padding: '14px 16px', fontFamily: 'JetBrains Mono, monospace' }}>
                      {getDiffHunks(current.current, current.proposed).map((hunk, hi) => (
                        <div key={hi} style={{ marginBottom: '20px', border: '1px solid #334155', borderRadius: '4px', overflow: 'hidden' }}>
                          {hunk.map((line, li) => (
                            <div key={li} style={{
                              display: 'flex', fontSize: '12px', lineHeight: '1.6',
                              background: line.type === 'added' ? 'rgba(16, 185, 129, 0.15)' : line.type === 'removed' ? 'rgba(239, 68, 68, 0.15)' : 'transparent'
                            }}>
                              <div style={{ width: '35px', textAlign: 'right', paddingRight: '10px', color: '#64748b', fontSize: '10px', userSelect: 'none' }}>{line.oldLine || ''}</div>
                              <div style={{ width: '35px', textAlign: 'right', paddingRight: '10px', color: '#64748b', fontSize: '10px', userSelect: 'none' }}>{line.newLine || ''}</div>
                              <div style={{
                                flex: 1, whiteSpace: 'pre-wrap', paddingLeft: '8px',
                                color: line.type === 'added' ? '#34d399' : line.type === 'removed' ? '#f87171' : '#e2e8f0'
                              }}>
                                {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}{line.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <pre style={{
                      margin: 0, padding: '14px 16px',
                      background: '#1e293b', color: '#e2e8f0',
                      fontSize: '12px', lineHeight: '1.65',
                      fontFamily: 'JetBrains Mono, monospace', minHeight: '100%'
                    }}>
                      {previewTab === 'before' ? (current.current || '// קובץ חדש') : current.proposed}
                    </pre>
                  )}
                </div>

                <div style={{ padding: '10px 14px', borderTop: '1px solid #e2e8f0', flexShrink: 0, direction: 'rtl' }}>
                  <button onClick={() => { onClose(); executePlan(); }} style={{
                    width: '100%', padding: '10px', background: '#10b981', color: '#fff',
                    border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px'
                  }}>
                    <CheckCircle2 size={16} /> אשר ביצוע בגיט
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}