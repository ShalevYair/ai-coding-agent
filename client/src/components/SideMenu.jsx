import React, { useState } from 'react';
import {
  Settings,
  Plus,
  FolderOpen,
  ChevronRight,
  ChevronLeft,
  Map,
  Paperclip,
  FileText,
  Archive,
  Download
} from 'lucide-react';

export function SideMenu({
  isOpen, setIsOpen,
  clearSession, autoSaveAndClear,
  fetchProjectMap,
  onOpenSettings,
  onOpenContextFiles,
  darkMode,
  selectedRepo, setSelectedRepo, repoList,
  onOpenLoad, compressSession, fetchReadme
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleNewChatClick = () => setShowConfirm(true);

  const handleSaveAndNew = async () => {
    setShowConfirm(false);
    await autoSaveAndClear();
  };

  const handleSkipSave = () => {
    setShowConfirm(false);
    clearSession();
  };

  return (
    <>
      <div style={{
        width: isOpen ? '180px' : '52px',
        minWidth: isOpen ? '180px' : '52px',
        background: darkMode ? '#1e293b' : '#fff',
        borderLeft: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.2s ease, min-width 0.2s ease',
        overflow: 'hidden',
        height: '100%',
        flexShrink: 0,
        userSelect: 'none',
      }}>
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', gap: '2px', padding: '4px' }}>

          <SideBtn icon={isOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />} label="סגור תפריט" title="פתח/סגור תפריט"
            onClick={() => setIsOpen(!isOpen)} isOpen={isOpen} darkMode={darkMode} />

          <Divider darkMode={darkMode} />

          <SideBtn icon={<Plus size={20} />} label="שיחה חדשה" title="שיחה חדשה"
            onClick={handleNewChatClick} isOpen={isOpen} darkMode={darkMode} />

          <SideBtn icon={<Map size={20} />} label="מפת פרויקט" title="מפת פרויקט" onClick={fetchProjectMap} isOpen={isOpen} darkMode={darkMode} />

          <SideBtn icon={<Paperclip size={20} />} label="קבצי הקשר" title="קבצי הקשר"
            onClick={onOpenContextFiles} isOpen={isOpen} darkMode={darkMode} />

          <SideBtn icon={<Download size={20} />} label="טעינת שיחה" title="טעינת שיחה"
            onClick={onOpenLoad} isOpen={isOpen} darkMode={darkMode} />

          <SideBtn icon={<Archive size={20} />} label="דחיסת שיחה" title="דחיסת שיחה"
            onClick={compressSession} isOpen={isOpen} darkMode={darkMode} />

          <SideBtn icon={<FileText size={20} />} label="קרא README" title="קרא README"
            onClick={fetchReadme} isOpen={isOpen} darkMode={darkMode} />

          <SideBtn
            icon={<Settings size={20} />}
            label="הגדרות"
            title="הגדרות"
            onClick={onOpenSettings}
            isOpen={isOpen}
            darkMode={darkMode}
          />

        </div>
      </div>

      {showConfirm && (
        <ConfirmPanel
          onSave={handleSaveAndNew}
          onSkip={handleSkipSave}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}

export { RepoDropdown };

const BTN_BASE = {
  background: 'none', border: 'none', cursor: 'pointer',
  display: 'flex', alignItems: 'center', width: '100%',
  padding: '9px 10px', borderRadius: '8px', textAlign: 'right',
  transition: 'background 0.15s',
};

function SideBtn({ icon, label, onClick, title, active, isOpen, danger, disabled, darkMode }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={disabled ? undefined : onClick}
      title={!isOpen ? title : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...BTN_BASE,
        background: hovered && !disabled ? (danger ? '#fee2e2' : (darkMode ? '#334155' : '#f1f5f9')) : 'none',
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'default' : 'pointer',
        justifyContent: isOpen ? 'flex-start' : 'center',
        gap: isOpen ? '10px' : 0,
      }}
    >
      <span style={{ fontSize: '18px', minWidth: '22px', textAlign: 'center', flexShrink: 0, lineHeight: 1, color: danger ? '#ef4444' : active ? '#3b82f6' : (darkMode ? '#f1f5f9' : '#374151') }}>
        {icon}
      </span>
      {isOpen && (
        <span style={{
          fontSize: '12px', fontWeight: active ? '700' : '500',
          color: danger ? '#ef4444' : active ? '#3b82f6' : (darkMode ? '#f1f5f9' : '#374151'),
          whiteSpace: 'nowrap', overflow: 'hidden',
        }}>
          {label}
        </span>
      )}
    </button>
  );
}

function Divider({ darkMode }) {
  return <div style={{ height: '1px', background: darkMode ? '#334155' : '#e2e8f0', margin: '4px 8px' }} />;
}

function ConfirmPanel({ onSave, onSkip, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)',
      zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        background: '#fff', borderRadius: '14px', padding: '20px',
        width: '100%', maxWidth: '300px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        direction: 'rtl'
      }}>
        <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#374151', fontWeight: '600' }}>
          האם לשמור את השיחה הנוכחית?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={onSave} style={{
            padding: '10px', borderRadius: '8px', border: 'none',
            background: '#3b82f6', color: '#fff', cursor: 'pointer',
            fontWeight: '600', fontSize: '13px'
          }}>שמור ואתחל שיחה חדשה</button>
          <button onClick={onSkip} style={{
            padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0',
            background: '#fff', color: '#374151', cursor: 'pointer',
            fontSize: '13px'
          }}>אתחל ללא שמירה</button>
          <button onClick={onCancel} style={{
            padding: '10px', borderRadius: '8px', border: 'none',
            background: 'none', color: '#94a3b8', cursor: 'pointer',
            fontSize: '13px'
          }}>ביטול</button>
        </div>
      </div>
    </div>
  );
}

function RepoDropdown({ repoList, selectedRepo, setSelectedRepo, onClose, anchor }) {
  const style = anchor
    ? { position: 'fixed', top: anchor.top + 'px', ...(anchor.left != null ? { left: anchor.left + 'px' } : { right: anchor.right + 'px' }) }
    : { position: 'fixed', top: '50%', right: '60px', transform: 'translateY(-50%)' };
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000
    }} onClick={onClose}>
      <div style={{
        ...style,
        background: '#fff', borderRadius: '12px', padding: '8px',
        boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
        minWidth: '200px', maxHeight: '300px', overflowY: 'auto',
        zIndex: 2001, direction: 'rtl'
      }} onClick={e => e.stopPropagation()}>
        <p style={{ margin: '0 0 8px', padding: '4px 8px', fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>
          בחר פרויקט
        </p>
        {repoList.length === 0 && (
          <p style={{ padding: '8px', fontSize: '13px', color: '#94a3b8' }}>אין פרויקטים</p>
        )}
        {repoList.map(r => (
          <button key={r} onClick={() => { setSelectedRepo(r); onClose(); }} style={{
            display: 'block', width: '100%', textAlign: 'right', padding: '8px 12px',
            background: r === selectedRepo ? '#eff6ff' : 'none',
            color: r === selectedRepo ? '#3b82f6' : '#374151',
            border: 'none', borderRadius: '6px', cursor: 'pointer',
            fontSize: '13px', fontWeight: r === selectedRepo ? '600' : '400'
          }}>{r}</button>
        ))}
      </div>
    </div>
  );
}