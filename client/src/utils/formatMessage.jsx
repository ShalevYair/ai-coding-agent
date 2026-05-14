import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const colorizeEnglish = (text, isUser = false) => {
  const parts = text.split(/(\b[A-Za-z][\w.\-/]*\b)/g);
  return parts.map((part, i) =>
    /^[A-Za-z]/.test(part)
      ? <span key={i} style={{ color: isUser ? '#bfdbfe' : '#2563eb', fontWeight: 500 }}>{part}</span>
      : part
  );
};

const parseInline = (text, isUser) => {
  const parts = text.split(/(\*\*[^*\n]+\*\*|`[^`\n]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{colorizeEnglish(part.slice(2, -2), isUser)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} style={{
          background: isUser ? 'rgba(255,255,255,0.18)' : '#f1f5f9',
          color: isUser ? '#e0f2fe' : '#0f172a',
          padding: '1px 5px', borderRadius: '4px',
          fontFamily: 'JetBrains Mono, monospace', fontSize: '0.88em',
          border: isUser ? '1px solid rgba(255,255,255,0.2)' : '1px solid #e2e8f0'
        }}>{part.slice(1, -1)}</code>
      );
    }
    return <React.Fragment key={i}>{colorizeEnglish(part, isUser)}</React.Fragment>;
  });
};

const formatTextSegment = (text, isUser) => {
  const paragraphs = text.split(/\n{2,}/);
  return paragraphs.map((para, pi) => {
    const sentences = para.split(/(?<=\.)\s+/g);
    const lines = sentences.map((s, si) => (
      <React.Fragment key={si}>
        {parseInline(s, isUser)}
        {si < sentences.length - 1 && <br />}
      </React.Fragment>
    ));
    // Single \n within paragraph
    const withNewlines = para.split('\n').length > 1
      ? para.split('\n').map((line, li) => (
          <React.Fragment key={li}>
            {li > 0 && <br />}
            {parseInline(line, isUser)}
          </React.Fragment>
        ))
      : lines;

    return (
      <div key={pi} style={{ marginBottom: pi < paragraphs.length - 1 ? '8px' : 0 }}>
        {withNewlines}
      </div>
    );
  });
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

export const formatMessage = (text, isUser = false) => {
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
      <React.Fragment key={i}>
        {formatTextSegment(part, isUser)}
      </React.Fragment>
    );
  });
};
