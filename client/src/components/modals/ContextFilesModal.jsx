import React, { useState } from 'react';
import { X } from 'lucide-react';
import { modalOverlay, modalCard } from '../../utils/theme';

export function ContextFilesModal({
  contextFiles, toggleContextFile,
  allFiles, onClose,
  selectedRepo,
}) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('active'); // 'active' | 'add'

  const filteredAll = (allFiles || [])
    .filter(f => !contextFiles.includes(f))
    .filter(f => f.toLowerCase().includes(search.toLowerCase()));

  const tabStyle = (t) => ({
    padding: '7px 14px', border: 'none', borderRadius: '8px',
    cursor: 'pointer', fontSize: '13px', fontWeight: '600',
    background: tab === t ? '#3b82f6' : 'none',
    color: tab === t ? '#fff' : '#64748b',
  });

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalCard('480px', '85vh')} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: '16px' }}>🗄️ קבצי הקשר</h2>
          <X onClick={onClose} style={{ cursor: 'pointer', color: '#94a3b8' }} size={20} />
        </div>

        {/* Context info */}
        <div style={{ padding: '10px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b', flexShrink: 0 }}>
          קבצים שמצורפים כהקשר לכל פרומט בשיחה. מעבר לזה, הסוכן קורא אוטומטית את
          <strong> Gemini.md </strong>ו-<strong>project_map.json</strong> ומזהה קבצים שנזכרים בשאלה.
        </div>

        {/* Tabs */}
        <div style={{ padding: '8px 16px', display: 'flex', gap: '4px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
          <button style={tabStyle('active')} onClick={() => setTab('active')}>
            פעיל ({contextFiles.length})
          </button>
          <button style={tabStyle('add')} onClick={() => setTab('add')}>
            הוסף קובץ
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {tab === 'active' && (
            <>
              {contextFiles.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
                  אין קבצי הקשר פעילים.<br />
                  לחץ על "הוסף קובץ" להוסיף.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {contextFiles.map(f => (
                    <div key={f} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 12px', background: '#eff6ff', borderRadius: '8px',
                      border: '1px solid #bfdbfe'
                    }}>
                      <span style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: '#1d4ed8' }}>{f}</span>
                      <button onClick={() => toggleContextFile(f)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#94a3b8', padding: '2px', display: 'flex'
                      }}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'add' && (
            <>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="חפש קובץ..."
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: '8px',
                  border: '1px solid #e2e8f0', fontSize: '13px', marginBottom: '10px',
                  boxSizing: 'border-box', direction: 'ltr'
                }}
              />
              {filteredAll.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center' }}>
                  {search ? 'לא נמצאו קבצים' : 'כל הקבצים כבר בהקשר'}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {filteredAll.slice(0, 100).map(f => (
                    <button key={f} onClick={() => { toggleContextFile(f); setTab('active'); }} style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '7px 10px', background: 'none', border: '1px solid #e2e8f0',
                      borderRadius: '6px', cursor: 'pointer', textAlign: 'right',
                      fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: '#374151',
                      direction: 'ltr'
                    }}>
                      <span style={{ color: '#10b981' }}>+</span>
                      {f}
                    </button>
                  ))}
                  {filteredAll.length > 100 && (
                    <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '8px 0' }}>
                      מציג 100 ראשונים — סנן לצמצום
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', flexShrink: 0 }}>
          <button onClick={onClose} style={{
            width: '100%', padding: '11px', background: '#f1f5f9', color: '#374151',
            border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600'
          }}>סגור</button>
        </div>
      </div>
    </div>
  );
}
