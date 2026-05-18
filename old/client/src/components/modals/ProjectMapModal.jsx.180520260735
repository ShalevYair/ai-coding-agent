import React, { useState } from 'react';
import { X, Loader2, RefreshCw } from 'lucide-react';
import { modalOverlay, modalCard } from '../../utils/theme';
import { groupByDir } from '../../utils/mapUtils';

function FileDescriptionPopup({ file, description, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1100, padding: '20px', pointerEvents: 'none'
    }}>
      <div style={{
        background: '#fff', borderRadius: '12px', padding: '16px 18px',
        maxWidth: '360px', width: '100%',
        boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
        border: '1px solid #e2e8f0', pointerEvents: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <code style={{
            fontSize: '12px', color: '#3b82f6',
            background: '#eff6ff', padding: '2px 6px', borderRadius: '4px', wordBreak: 'break-all'
          }}>
            {file}
          </code>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', marginRight: '8px', flexShrink: 0 }}>
            <X size={16} />
          </button>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>
          {description || 'אין תיאור זמין לקובץ זה.'}
        </p>
      </div>
    </div>
  );
}

export function ProjectMapModal({ mapData, mapLoading, mapRefreshing, selectedRepo, selectedMapFile, setSelectedMapFile, contextFiles, toggleContextFile, onClose, onRefresh }) {
  return (
    <>
      <div style={{ ...modalOverlay, alignItems: 'flex-start', justifyContent: 'flex-start', paddingTop: '60px' }} onClick={onClose}>
        <div style={modalCard('560px', '85vh')} onClick={e => e.stopPropagation()}>
          <div style={{
            padding: '14px 18px', borderBottom: '1px solid #e2e8f0',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0
          }}>
            <span style={{ fontWeight: 'bold', fontSize: '15px' }}>🗺️ מפת פרויקט — {selectedRepo}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={onRefresh}
                disabled={mapRefreshing || mapLoading}
                title="רענן מפת פרויקט עם Gemini Flash-Lite"
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '5px 10px', borderRadius: '6px', border: '1px solid #e2e8f0',
                  background: mapRefreshing ? '#f8fafc' : '#fff', cursor: mapRefreshing ? 'default' : 'pointer',
                  fontSize: '12px', color: '#475569', fontWeight: '500',
                  opacity: mapRefreshing ? 0.7 : 1
                }}
              >
                {mapRefreshing
                  ? <Loader2 size={13} className="animate-spin" />
                  : <RefreshCw size={13} />}
                {mapRefreshing ? 'מרענן...' : 'רענן'}
              </button>
              <X onClick={onClose} style={{ cursor: 'pointer', color: '#94a3b8' }} size={20} />
            </div>
          </div>

          {mapRefreshing && (
            <div style={{
              padding: '8px 18px', background: '#eff6ff',
              borderBottom: '1px solid #bfdbfe',
              display: 'flex', alignItems: 'center', gap: '8px',
              fontSize: '12px', color: '#1d4ed8', flexShrink: 0
            }}>
              <Loader2 size={13} className="animate-spin" />
              סורק את כל קבצי הפרויקט עם Gemini Flash-Lite — זה עשוי לקחת כחצי דקה...
            </div>
          )}

          <div style={{ padding: '14px 18px', overflowY: 'auto', flex: 1 }}>
            {mapLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '30px' }}>
                <Loader2 className="animate-spin" size={24} color="#64748b" />
              </div>
            ) : !mapData ? (
              <p style={{ color: '#64748b', textAlign: 'center' }}>לא נמצא קובץ project_map.json בפרויקט זה.</p>
            ) : (
              <>
                {mapData.summary && (
                  <p style={{ fontSize: '13px', color: '#475569', marginBottom: '12px', marginTop: 0 }}>{mapData.summary}</p>
                )}
                {mapData.tech_stack?.length > 0 && (
                  <div style={{ marginBottom: '14px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {mapData.tech_stack.map((t, i) => (
                      <span key={i} style={{
                        background: '#eff6ff', color: '#3b82f6',
                        padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: '600'
                      }}>{t}</span>
                    ))}
                  </div>
                )}

                {Object.entries(groupByDir(mapData.files)).map(([dir, paths]) => (
                  <div key={dir} style={{ marginBottom: '10px' }}>
                    <div style={{
                      fontSize: '11px', fontWeight: '700', color: '#64748b',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      marginBottom: '4px', direction: 'ltr'
                    }}>
                      {dir}/
                    </div>
                    {paths.map(path => (
                      <div key={path} style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        padding: '3px 4px', borderRadius: '6px', marginBottom: '1px',
                        background: selectedMapFile === path ? '#eff6ff' : 'transparent'
                      }}>
                        <button onClick={() => setSelectedMapFile(path)} style={{
                          flex: 1, textAlign: 'left', background: 'transparent',
                          border: 'none', cursor: 'pointer', padding: '2px 4px',
                          fontSize: '12px', fontFamily: 'JetBrains Mono, monospace',
                          color: '#1e293b', direction: 'ltr'
                        }}>
                          📄 {path.split('/').pop()}
                          <span style={{ color: '#94a3b8', fontSize: '10px', marginRight: '4px' }}>
                            {path.includes('/') ? ` (${path})` : ''}
                          </span>
                        </button>
                        <button onClick={() => { toggleContextFile(path); onClose(); }} style={{
                          background: contextFiles.includes(path) ? '#dbeafe' : 'transparent',
                          border: '1px solid ' + (contextFiles.includes(path) ? '#93c5fd' : '#e2e8f0'),
                          borderRadius: '4px', cursor: 'pointer', padding: '2px 5px',
                          fontSize: '10px', color: contextFiles.includes(path) ? '#1d4ed8' : '#94a3b8',
                          whiteSpace: 'nowrap', flexShrink: 0
                        }}>
                          {contextFiles.includes(path) ? '📌' : '+ קונטקסט'}
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {selectedMapFile && mapData && (
        <FileDescriptionPopup
          file={selectedMapFile}
          description={mapData.files[selectedMapFile]}
          onClose={() => setSelectedMapFile(null)}
        />
      )}
    </>
  );
}