import { useState } from 'react';

export function Tooltip({ text, children }) {
  const [visible, setVisible] = useState(false);
  return (
    <div
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: '50%',
          transform: 'translateX(-50%)',
          background: '#1e293b', color: '#f8fafc',
          padding: '3px 8px', borderRadius: '5px',
          fontSize: '11px', whiteSpace: 'nowrap',
          zIndex: 9999, pointerEvents: 'none',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
        }}>
          {text}
        </span>
      )}
    </div>
  );
}
