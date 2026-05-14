import React, { useState } from 'react';
import { Send, X } from 'lucide-react';

export function ChatInput({ loading, sendMessage, contextFiles, toggleContextFile, fontSize }) {
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (!inputText.trim() || loading) return;
    const text = inputText;
    setInputText('');
    sendMessage(text);
  };

  return (
    <>
      {contextFiles.length > 0 && (
        <div style={{
          padding: '6px 12px', background: '#eff6ff',
          borderTop: '1px solid #bfdbfe',
          display: 'flex', flexWrap: 'wrap', gap: '5px', flexShrink: 0
        }}>
          <span style={{ fontSize: '10px', color: '#3b82f6', fontWeight: '600', alignSelf: 'center' }}>📌 קונטקסט:</span>
          {contextFiles.map(f => (
            <span key={f} onClick={() => toggleContextFile(f)} style={{
              background: '#dbeafe', color: '#1d4ed8', padding: '2px 7px',
              borderRadius: '99px', fontSize: '10px', fontFamily: 'JetBrains Mono, monospace',
              display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer'
            }}>
              {f.split('/').pop()} <X size={9} />
            </span>
          ))}
        </div>
      )}

      <div style={{
        padding: '10px 12px', background: '#fff',
        borderTop: '1px solid #e2e8f0',
        display: 'flex', gap: '8px', flexShrink: 0
      }}>
        <input
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSend()}
          placeholder="מה נבנה עכשיו?"
          style={{
            flex: 1, padding: '10px 12px', borderRadius: '10px',
            border: '1px solid #e2e8f0', outline: 'none',
            fontSize: `${fontSize}px`, fontFamily: 'Rubik, sans-serif'
          }}
        />
        <button onClick={handleSend} disabled={loading} style={{
          background: loading ? '#94a3b8' : '#3b82f6', color: '#fff',
          border: 'none', padding: '10px 12px', borderRadius: '10px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}>
          <Send size={18} />
        </button>
      </div>
    </>
  );
}
