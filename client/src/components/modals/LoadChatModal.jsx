import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { modalOverlay, modalCard } from '../../utils/theme';

export function LoadChatModal({ savedChats, loadListLoading, onLoad, onClose }) {
  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={{ ...modalCard('460px', '75vh'), direction: 'rtl' }} onClick={e => e.stopPropagation()}>
        <div style={{
          padding: '14px 18px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0
        }}>
          <span style={{ fontWeight: 'bold', fontSize: '15px' }}>📂 שיחות שמורות</span>
          <X onClick={onClose} style={{ cursor: 'pointer', color: '#94a3b8' }} size={20} />
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loadListLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <Loader2 className="animate-spin" size={24} color="#64748b" />
            </div>
          ) : savedChats.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 20px' }}>
              אין שיחות שמורות עדיין.
            </p>
          ) : (
            <div style={{ padding: '8px' }}>
              {savedChats.map(chat => (
                <button key={chat.id} onClick={() => { onLoad(chat); onClose(); }} style={{
                  width: '100%', textAlign: 'right', background: '#fff',
                  border: '1px solid #e2e8f0', borderRadius: '8px',
                  padding: '12px 14px', marginBottom: '6px', cursor: 'pointer',
                  transition: 'background 0.15s'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '600', fontSize: '14px', color: '#1e293b' }}>{chat.title}</span>
                    <span style={{
                      fontSize: '10px', background: chat.type === 'summary' ? '#fef3c7' : '#eff6ff',
                      color: chat.type === 'summary' ? '#92400e' : '#1d4ed8',
                      padding: '2px 7px', borderRadius: '99px', fontWeight: '600'
                    }}>
                      {chat.type === 'summary' ? 'סיכום' : 'מלא'}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                    {chat.date} · {chat.messageCount} הודעות
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
