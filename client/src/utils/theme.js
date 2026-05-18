export const theme = {
  diffAdd: '#dcfce7',
  diffRemove: '#fee2e2'
};

export const iconBtn = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: '18px', padding: '5px', borderRadius: '6px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  lineHeight: 1
};

export const modalOverlay = {
  position: 'fixed', inset: 0,
  background: 'rgba(15, 23, 42, 0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000, padding: '16px'
};

export const modalCard = (maxW = '480px', maxH = '80vh') => ({
  background: '#1e293b', borderRadius: '16px',
  width: '100%', maxWidth: maxW,
  maxHeight: maxH, display: 'flex', flexDirection: 'column',
  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)',
  overflow: 'hidden', position: 'relative'
});

export const darkModalCard = (maxW = '480px', maxH = '80vh') => ({
  background: '#1e293b', borderRadius: '16px',
  width: '100%', maxWidth: maxW,
  maxHeight: maxH, display: 'flex', flexDirection: 'column',
  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
  overflow: 'hidden', position: 'relative', color: '#f8fafc'
});

export const labelStyle = {
  fontSize: '12px', color: '#64748b',
  marginBottom: '6px', display: 'block', fontWeight: '600'
};

export const modalInputStyle = {
  width: '100%', padding: '11px 12px', marginBottom: '13px',
  borderRadius: '10px', border: '1px solid #334155',
  background: '#0f172a', color: '#f1f5f9',
  boxSizing: 'border-box', fontSize: '14px'
};