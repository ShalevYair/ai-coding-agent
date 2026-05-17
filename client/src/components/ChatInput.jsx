import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Send, X } from 'lucide-react';

const LINE_HEIGHT = 24;
const MAX_LINES = 6;
const INITIAL_LINES = 2;

export function ChatInput({ loading, sendMessage, contextFiles, toggleContextFile, fontSize, agentState }) {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  const adjustHeight = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const maxHeight = LINE_HEIGHT * MAX_LINES;
    ta.style.height = Math.min(ta.scrollHeight, maxHeight) + 'px';
    ta.style.overflowY = ta.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [inputText, adjustHeight]);

  const handleChange = (e) => {
    setInputText(e.target.value);
  };

  const handleSend = (explicitText) => {
    if (loading) return;
    const text = typeof explicitText === 'string' ? explicitText : inputText;
    if (!text.trim() && !agentState) return;
    setInputText('');
    sendMessage(text);
    const ta = textareaRef.current;
    if (ta) { 
      ta.style.height = LINE_HEIGHT * INITIAL_LINES + 'px'; 
      ta.style.overflowY = 'hidden'; 
      ta.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'he-IL';
    recognition.continuous = false;
    recognition.interimResults = false;

    const stopListening = () => recognition.stop();

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    
    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      const currentFull = (inputText + (inputText.length > 0 ? ' ' : '') + transcript).trim();
      
      if (currentFull.endsWith('רות') || currentFull.endsWith('רות.')) {
        const cleanText = currentFull.replace(/רות\.?$/, '').trim();
        setInputText(cleanText);
        stopListening();
        handleSend(cleanText);
      } else {
        setInputText(currentFull);
      }
    };

    recognition.start();
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
          rows={INITIAL_LINES}
          style={{
            flex: 1, padding: '10px 12px', borderRadius: '10px',
            border: '1px solid #e2e8f0', outline: 'none',
            fontSize: `${fontSize}px`, fontFamily: 'Rubik, sans-serif',
            resize: 'none', lineHeight: `${LINE_HEIGHT}px`,
            height: `${LINE_HEIGHT * INITIAL_LINES}px`,
            overflowY: 'hidden', direction: 'rtl'
          }}
        />
        <button 
          onClick={startSpeechRecognition}
          style={{
            background: isListening ? '#fee2e2' : '#f1f5f9',
            border: 'none', padding: '10px 12px', borderRadius: '10px',
            cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: '42px', transition: 'all 0.2s', fontSize: '18px'
          }}
          title="הקלט הודעה"
        >
          🎤
        </button>
        <button onClick={handleSend} disabled={loading} style={{
          background: loading ? '#94a3b8' : '#3b82f6', color: '#fff',
          border: 'none', padding: '10px 12px', borderRadius: '10px',
          cursor: loading ? 'not-allowed' : 'pointer', flexShrink: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px',
          minWidth: '42px', minHeight: '42px', justifyContent: 'center'
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