import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { modalOverlay, modalCard } from '../../utils/theme';

export function ReadmeModal({ content, loading, selectedRepo, onClose }) {
  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalCard('560px', '85vh')} onClick={e => e.stopPropagation()}>
        <div style={{
          padding: '14px 18px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0
        }}>
          <span style={{ fontWeight: 'bold', fontSize: '15px' }}>📄 README — {selectedRepo}</span>
          <X onClick={onClose} style={{ cursor: 'pointer', color: '#94a3b8' }} size={20} />
        </div>
        <div style={{ padding: '16px 18px', overflowY: 'auto', direction: 'ltr' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '30px' }}>
              <Loader2 className="animate-spin" size={24} color="#64748b" />
            </div>
          ) : (
            <pre style={{
              margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit',
              fontSize: '13px', lineHeight: '1.6', color: '#1e293b'
            }}>
              {content}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
