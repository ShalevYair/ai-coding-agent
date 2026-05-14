import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const colorizeEnglish = (text) => {
  const parts = text.split(/(\b[A-Za-z][\w.\-/]*\b)/g);
  return parts.map((part, i) =>
    /^[A-Za-z]/.test(part)
      ? <span key={i} style={{ color: '#2563eb', fontWeight: 500 }}>{part}</span>
      : part
  );
};

const formatTextSegment = (text) => {
  const sentences = text.split(/(?<=\.)\s+/g);
  return sentences.map((sentence, i) => (
    <React.Fragment key={i}>
      {colorizeEnglish(sentence)}
      {i < sentences.length - 1 && <br />}
    </React.Fragment>
  ));
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy} style={{
      position: 'absolute', top: '6px', left: '6px',
      background: copied ? '#10b981' : '#334155',
      border: 'none', borderRadius: '5px',
      padding: '3px 7px', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: '4px',
      color: '#e2e8f0', fontSize: '11px'
    }}>
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'הועתק' : 'Copy'}
    </button>
  );
}

export const formatMessage = (text) => {
  if (!text) return null;
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const langMatch = part.match(/^```([a-z]*)/);
      const lang = langMatch?.[1] || '';
      const code = part.replace(/```[a-z]*\n?|```$/g, '').trim();
      return (
        <div key={i} style={{ direction: 'ltr', textAlign: 'left', margin: '10px 0', position: 'relative' }}>
          {lang && (
            <div style={{
              background: '#0f172a', color: '#64748b', fontSize: '10px',
              padding: '3px 10px', borderRadius: '8px 8px 0 0',
              fontFamily: 'JetBrains Mono, monospace'
            }}>{lang}</div>
          )}
          <pre style={{
            background: '#1e293b', color: '#e2e8f0',
            padding: '10px 12px', paddingTop: lang ? '8px' : '28px',
            borderRadius: lang ? '0 0 8px 8px' : '8px',
            overflowX: 'auto', fontSize: '12px',
            border: '1px solid #334155',
            fontFamily: 'JetBrains Mono, monospace', margin: 0, lineHeight: '1.6'
          }}>
            <CopyButton text={code} />
            <code>{code}</code>
          </pre>
        </div>
      );
    }
    return (
      <span key={i} style={{ whiteSpace: 'pre-wrap' }}>
        {formatTextSegment(part)}
      </span>
    );
  });
};
