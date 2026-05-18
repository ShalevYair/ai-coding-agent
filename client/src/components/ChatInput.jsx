import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, X, Mic, MicOff, Paperclip } from 'lucide-react';

const LINE_HEIGHT = 24;
const MAX_LINES = 6;
const INITIAL_LINES = 2;

export function ChatInput({ loading, sendMessage, contextFiles, toggleContextFile, fontSize, agentState }) {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const userWantsListeningRef = useRef(false); // true = mic should always be on
  const startListeningRef = useRef(null);

  const adjustHeight = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const maxHeight = LINE_HEIGHT * MAX_LINES;
    ta.style.height = Math.min(ta.scrollHeight, maxHeight) + 'px';
    ta.style.overflowY = ta.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, []);

  useEffect(() => { adjustHeight(); }, [inputText, adjustHeight]);

  // Keep ref always fresh so onresult can call the latest handleSend
  const handleSendRef = useRef(null);

  // startListening is stored in a ref so onend can recursively restart it
  startListeningRef.current = () => {
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (!SpeechRecognition || !userWantsListeningRef.current) return;

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'he-IL';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);

    recognition.onend = () => {
      // Auto-restart as long as user wants mic on
      if (userWantsListeningRef.current) {
        setTimeout(() => startListeningRef.current?.(), 300);
      } else {
        setIsListening(false);
      }
    };

    recognition.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'audio-capture') {
        // Permission denied — force off
        userWantsListeningRef.current = false;
        setIsListening(false);
      }
      // Other errors: onend fires next and restarts if needed
    };

    recognition.onresult = (event) => {
      let resultChunk = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) resultChunk += event.results[i][0].transcript;
      }
      if (resultChunk) {
        setInputText(prev => {
          const combined = (prev + (prev.length > 0 ? ' ' : '') + resultChunk).trim();
          if (combined.endsWith('רות') || combined.endsWith('רות.')) {
            const cleanText = combined.replace(/רות\.?$/, '').trim();
            setTimeout(() => handleSendRef.current?.(cleanText), 0);
            return '';
          }
          return combined;
        });
      }
    };

    try { recognition.start(); } catch (_) { /* ignore if already starting */ }
  };

  const toggleMic = () => {
    if (userWantsListeningRef.current) {
      userWantsListeningRef.current = false;
      recognitionRef.current?.stop();
    } else {
      userWantsListeningRef.current = true;
      startListeningRef.current();
      textareaRef.current?.focus();
    }
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

  handleSendRef.current = handleSend;

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
          <span style={{
            fontSize: '10px', color: '#3b82f6', fontWeight: '600',
            alignSelf: 'center', display: 'flex', alignItems: 'center', gap: '4px'
          }}>
            <Paperclip size={20} /> קונטקסט:
          </span>
          {contextFiles.map(f => (
            <span key={f} onClick={() => toggleContextFile(f)} style={{
              background: '#dbeafe', color: '#1d4ed8', padding: '2px 7px',
              borderRadius: '99px', fontSize: '10px', fontFamily: 'JetBrains Mono, monospace',
              display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer'
            }}>
              {f.split('/').pop()} <X size={20} />
            </span>
          ))}
        </div>
      )}

      <div style={{
        width: '100%', margin: 0, boxSizing: 'border-box',
        padding: '10px 12px', background: '#fff',
        borderTop: '1px solid #e2e8f0',
        display: 'flex', gap: '8px', alignItems: 'flex-end', flexShrink: 0
      }}>
        <button
          onClick={toggleMic}
          style={{
            background: isListening ? '#fee2e2' : '#f1f5f9',
            border: 'none', padding: 0, borderRadius: '10px',
            cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '48px', height: '48px', transition: 'all 0.2s',
            aspectRatio: '1/1', fontFamily: 'Rubik'
          }}
          title={isListening ? 'כבה מיקרופון' : 'הדלק מיקרופון'}
        >
          {isListening ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={agentState ? 'כתוב מה לשנות בפרומט, או השאר ריק לאישור' : 'מה נבנה עכשיו? (Shift+Enter לשורה חדשה)'}
          rows={INITIAL_LINES}
          style={{
            flex: 1, padding: '10px 12px', borderRadius: '10px',
            border: '1px solid #e2e8f0', outline: 'none',
            fontSize: `${fontSize}px`, fontFamily: "'Rubik', sans-serif",
            resize: 'none', lineHeight: `${LINE_HEIGHT}px`,
            height: `${LINE_HEIGHT * INITIAL_LINES}px`,
            overflowY: 'hidden', direction: 'rtl'
          }}
        />

        <button onClick={handleSend} disabled={loading} style={{
          background: loading ? '#94a3b8' : '#3b82f6', color: '#fff',
          border: 'none', padding: 0, borderRadius: '10px',
          cursor: loading ? 'not-allowed' : 'pointer', flexShrink: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', width: '48px', height: '48px', gap: '1px',
          aspectRatio: '1/1', fontFamily: 'Rubik'
        }}>
          <Send size={24} />
          {agentState && (
            <span style={{ fontSize: '9px', lineHeight: 1, fontWeight: '700' }}>
              {agentState.step + 1}/{agentState.totalSteps}
            </span>
          )}
        </button>

        <button
          onClick={() => setIsMuted(!isMuted)}
          style={{
            background: !isMuted ? '#eff6ff' : '#f1f5f9',
            border: 'none', padding: 0, borderRadius: '10px',
            cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '48px', height: '48px', transition: 'all 0.2s', fontSize: '24px',
            aspectRatio: '1/1', fontFamily: 'Rubik'
          }}
          title={!isMuted ? 'השתק הקראה' : 'הפעל הקראה'}
        >
          {!isMuted ? '🔊' : '🔇'}
        </button>
      </div>
    </>
  );
}