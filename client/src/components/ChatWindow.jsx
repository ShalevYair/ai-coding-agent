import React, { useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { MessageBubble } from './MessageBubble';

export function ChatWindow({ messages, loading, fontSize, executePlan, fetchPreview, answerAsk, darkMode }) {
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
      {messages.map((m, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
          <MessageBubble
            message={m}
            fontSize={fontSize}
            executePlan={executePlan}
            fetchPreview={fetchPreview}
            answerAsk={answerAsk}
            currentMessages={messages}
            darkMode={darkMode}
          />
        </div>
      ))}

      {loading && (
        <div style={{ display: 'flex', marginBottom: '12px' }}>
          <div style={{
            padding: '10px 14px', borderRadius: '14px',
            background: '#e2e8f0', color: '#1e293b',
            border: '1px solid #cbd5e1',
            display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px'
          }}>
            <span>🤖</span>
            <Loader2 className="animate-spin" size={15} />
            <span>חושב...</span>
          </div>
        </div>
      )}
      <div ref={chatEndRef} />
    </div>
  );
}