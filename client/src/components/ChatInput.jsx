import React, { useState, useRef, useCallback } from 'react';
import { Send, X } from 'lucide-react';

const LINE_HEIGHT = 24;
const MAX_LINES = 6;

export function ChatInput({ loading, sendMessage, contextFiles, toggleContextFile, fontSize, agentState }) {
  const [inputText, setInputText] = useState('');
  const textareaRef = useRef(null);

  const adjustHeight = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const maxHeight = LINE_HEIGHT * MAX_LINES;
    ta.style.height = Math.min(ta.scrollHeight, maxHeight) + 'px';
    ta.style.overflowY = ta.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, []);

  const handleChange = (e) => {
    setInputText(e.target.value);
    adjustHeight();
  };

  const handleSend = () => {
    if (loading) return;
    // Allow empty send when continuing an agent refinement step
    if (!inputText.trim() && !agentState) return;
    const text = inputText;
    setInputText('');
    sendMessage(text);
    const ta = textareaRef.current;
    if (ta) { ta.style.height = LINE_HEIGHT + 'px'; ta.style.overflowY = 'hidden'; }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
        display: 'flex', gap: '8px', alignItems: 'flex-end', flexShrink: 0
      }}>
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={agentState ? 'כתוב מה לשנות בפרומט, או השאר ריק לאישור' : 'מה נבנה עכשיו? (Shift+Enter לשורה חדשה)'}
          rows={1}
          style={{
            flex: 1, padding: '10px 12px', borderRadius: '10px',
            border: '1px solid #e2e8f0', outline: 'none',
            fontSize: `${fontSize}px`, fontFamily: 'Rubik, sans-serif',
            resize: 'none', lineHeight: `${LINE_HEIGHT}px`,
            height: `${LINE_HEIGHT}px`,
            overflowY: 'hidden', direction: 'rtl'
          }}
        />
        <button onClick={handleSend} disabled={loading} style={{
          background: loading ? '#94a3b8' : '#3b82f6', color: '#fff',
          border: 'none', padding: '10px 12px', borderRadius: '10px',
          cursor: loading ? 'not-allowed' : 'pointer', flexShrink: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px',
          minWidth: '42px'
        }}>
          <Send size={16} />
          {agentState && (
            <span style={{ fontSize: '9px', lineHeight: 1, fontWeight: '700' }}>
              {agentState.step + 1}/{agentState.totalSteps}
            </span>
          )}
        </button>
      </div>
    </>
  );
}
