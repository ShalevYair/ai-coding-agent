import React from 'react';
import { X, Loader2, CheckCircle2 } from 'lucide-react';
import { modalOverlay, modalCard } from '../../utils/theme';

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
                    {['before', 'after'].map(tab => (
                      <button key={tab} onClick={() => setPreviewTab(tab)} style={{
                        padding: '3px 10px', fontSize: '11px', cursor: 'pointer',
                        borderRadius: '5px', border: '1px solid #e2e8f0',
                        background: previewTab === tab ? '#3b82f6' : '#fff',
                        color: previewTab === tab ? '#fff' : '#64748b'
                      }}>
                        {tab === 'before' ? 'לפני' : 'אחרי'}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <pre style={{
                    margin: 0, padding: '14px 16px',
                    background: '#1e293b', color: '#e2e8f0',
                    fontSize: '12px', lineHeight: '1.65',
                    fontFamily: 'JetBrains Mono, monospace', minHeight: '100%'
                  }}>
                    {previewTab === 'before' ? (current.current || '// קובץ חדש') : current.proposed}
                  </pre>
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
