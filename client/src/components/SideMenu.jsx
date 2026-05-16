import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import { RESPONSE_LENGTHS, AGENT_MODES, MEMORY_MODES } from '../utils/constants';

const BTN_BASE = {
  background: 'none', border: 'none', cursor: 'pointer',
  display: 'flex', alignItems: 'center', width: '100%',
  padding: '9px 10px', borderRadius: '8px', textAlign: 'right',
  transition: 'background 0.15s',
};

function SideBtn({ icon, label, onClick, title, active, isOpen, danger, disabled }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={disabled ? undefined : onClick}
      title={!isOpen ? title : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...BTN_BASE,
        background: hovered && !disabled ? (danger ? '#fee2e2' : '#f1f5f9') : 'none',
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'default' : 'pointer',
        justifyContent: isOpen ? 'flex-start' : 'center',
        gap: isOpen ? '10px' : 0,
      }}
    >
      <span style={{ fontSize: '18px', minWidth: '22px', textAlign: 'center', flexShrink: 0, lineHeight: 1 }}>
        {icon}
      </span>
      {isOpen && (
        <span style={{
          fontSize: '12px', fontWeight: active ? '700' : '500',
          color: danger ? '#ef4444' : active ? '#3b82f6' : '#374151',
          whiteSpace: 'nowrap', overflow: 'hidden',
        }}>
          {label}
        </span>
      )}
    </button>
  );
}

function Divider() {
  return <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 8px' }} />;
}

// Small confirmation modal inside the sidebar for new chat
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

// Repo selector dropdown
function RepoDropdown({ repoList, selectedRepo, setSelectedRepo, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000
    }} onClick={onClose}>
      <div style={{
        position: 'fixed', top: '50%', right: '60px',
        transform: 'translateY(-50%)',
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

export function SideMenu({
  isOpen, setIsOpen,
  messages, clearSession, compressSession,
  onOpenLoad, onOpenSave, autoSaveAndClear,
  responseLength, cycleResponseLength,
  autoSave, toggleAutoSave,
  fetchProjectMap, fetchReadme,
  onOpenSettings, fontSize, changeFontSize,
  selectedRepo, setSelectedRepo, repoList,
  agentMode, cycleAgentMode,
  memoryMode, cycleMemoryMode,
  maxRetries, cycleMaxRetries,
  onUndo, canUndo,
  deepScanMode, toggleDeepScan,
  onOpenContextFiles,
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showRepoDropdown, setShowRepoDropdown] = useState(false);

  const handleNewChatClick = () => setShowConfirm(true);

  const handleSaveAndNew = async () => {
    setShowConfirm(false);
    await autoSaveAndClear();
  };

  const handleSkipSave = () => {
    setShowConfirm(false);
    clearSession();
  };

  const rl = RESPONSE_LENGTHS[responseLength];
  const am = AGENT_MODES[agentMode];
  const mm = MEMORY_MODES[memoryMode];

  return (
    <>
      <div style={{
        width: isOpen ? '180px' : '52px',
        minWidth: isOpen ? '180px' : '52px',
        background: '#fff',
        borderLeft: '1px solid #e2e8f0',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.2s ease, min-width 0.2s ease',
        overflow: 'hidden',
        height: '100%',
        flexShrink: 0,
        userSelect: 'none',
      }}>
        {/* Scrollable button area */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', gap: '2px', padding: '4px' }}>

          <SideBtn icon="☰" label="סגור תפריט" title="פתח/סגור תפריט"
            onClick={() => setIsOpen(!isOpen)} isOpen={isOpen} />

          <Divider />

          <SideBtn icon="➕" label="שיחה חדשה" title="שיחה חדשה"
            onClick={handleNewChatClick} isOpen={isOpen} />

          <SideBtn icon="💬" label="טען שיחה" title="טען שיחה"
            onClick={onOpenLoad} isOpen={isOpen} />

          <SideBtn icon="🗜️" label="דחוס שיחה" title="דחוס שיחה"
            onClick={compressSession} isOpen={isOpen} />

          <SideBtn
            icon="↩️"
            label="בטל שינוי אחרון"
            title="שחזר גרסה קודמת מגיטהאב"
            onClick={onUndo}
            isOpen={isOpen}
            disabled={!canUndo}
          />

          <SideBtn
            icon={String(maxRetries)}
            label={`${maxRetries} ניסיונות תיקון`}
            title="מספר ניסיונות אוטומטי אם הביצוע נכשל — לחץ למעבר"
            onClick={cycleMaxRetries}
            isOpen={isOpen}
            active={maxRetries !== 3}
          />

          <Divider />

          <SideBtn
            icon={rl.icon}
            label={rl.label}
            title={rl.label}
            onClick={cycleResponseLength}
            isOpen={isOpen}
          />

          <SideBtn
            icon={autoSave ? '💾' : '🚫'}
            label={autoSave ? 'שמירה אוטומטית' : 'שמירה כבויה'}
            title={autoSave ? 'שמירה אוטומטית פעילה' : 'שמירה אוטומטית כבויה'}
            onClick={toggleAutoSave}
            active={autoSave}
            isOpen={isOpen}
          />

          <Divider />

          <SideBtn icon="🗺️" label="מפת פרויקט" title="מפת פרויקט"
            onClick={fetchProjectMap} isOpen={isOpen} />

          <SideBtn icon="❓" label="עזרה / README" title="עזרה / README"
            onClick={fetchReadme} isOpen={isOpen} />

          <SideBtn
            icon="📁"
            label={selectedRepo || 'בחר פרויקט'}
            title="בחר פרויקט"
            onClick={() => setShowRepoDropdown(true)}
            isOpen={isOpen}
          />

          <Divider />

          <SideBtn
            icon={am.icon}
            label={am.label}
            title={am.label}
            onClick={cycleAgentMode}
            isOpen={isOpen}
            active={agentMode !== 'dove'}
          />

          <SideBtn
            icon={mm.icon}
            label={mm.label}
            title={mm.label}
            onClick={cycleMemoryMode}
            isOpen={isOpen}
            active={memoryMode !== 'cat'}
          />

          <SideBtn icon="🗄️" label="קבצי הקשר" title="קבצי הקשר"
            onClick={onOpenContextFiles} isOpen={isOpen} />

          {/* Deep scan button — S in red when active, gray when inactive */}
          <button
            onClick={toggleDeepScan}
            title={deepScanMode
              ? 'סריקה עמוקה פעילה — ההודעה הבאה תקרא את כל קבצי הפרויקט (Gemini 2.5 Flash-Lite)'
              : 'הפעל סריקה עמוקה של כל קבצי הפרויקט להודעה הבאה'}
            style={{
              ...BTN_BASE,
              justifyContent: isOpen ? 'flex-start' : 'center',
              gap: isOpen ? '10px' : 0,
              background: deepScanMode ? '#fee2e2' : 'none',
            }}
          >
            <span style={{
              fontSize: '15px', fontWeight: '900', fontFamily: 'monospace',
              minWidth: '22px', textAlign: 'center', flexShrink: 0, lineHeight: 1,
              color: deepScanMode ? '#ef4444' : '#94a3b8',
            }}>S</span>
            {isOpen && (
              <span style={{
                fontSize: '12px',
                fontWeight: deepScanMode ? '700' : '500',
                color: deepScanMode ? '#ef4444' : '#374151',
                whiteSpace: 'nowrap', overflow: 'hidden',
              }}>
                {deepScanMode ? 'סריקה עמוקה פעילה' : 'סריקה עמוקה'}
              </span>
            )}
          </button>

        </div>

        {/* Bottom — settings row with font size controls */}
        <div style={{ padding: '4px', borderTop: '1px solid #e2e8f0' }}>
          {isOpen ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 6px' }}>
              <button onClick={() => changeFontSize(-1)} title="הקטן גופן" style={{
                background: 'none', border: '1px solid #e2e8f0', cursor: 'pointer',
                width: '28px', height: '28px', borderRadius: '6px',
                fontSize: '15px', fontWeight: 'bold', color: '#64748b',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>−</button>
              <button onClick={onOpenSettings} title="הגדרות" style={{
                ...BTN_BASE, flex: 1, justifyContent: 'center', gap: '6px',
                padding: '5px 8px', color: '#374151', fontSize: '12px', fontWeight: '500'
              }}>
                <Settings size={15} />
                <span>הגדרות</span>
              </button>
              <button onClick={() => changeFontSize(+1)} title="הגדל גופן" style={{
                background: 'none', border: '1px solid #e2e8f0', cursor: 'pointer',
                width: '28px', height: '28px', borderRadius: '6px',
                fontSize: '15px', fontWeight: 'bold', color: '#64748b',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>+</button>
            </div>
          ) : (
            <SideBtn
              icon={<Settings size={17} />}
              label="הגדרות"
              title="הגדרות"
              onClick={onOpenSettings}
              isOpen={false}
            />
          )}
        </div>
      </div>

      {showConfirm && (
        <ConfirmPanel
          onSave={handleSaveAndNew}
          onSkip={handleSkipSave}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {showRepoDropdown && (
        <RepoDropdown
          repoList={repoList}
          selectedRepo={selectedRepo}
          setSelectedRepo={setSelectedRepo}
          onClose={() => setShowRepoDropdown(false)}
        />
      )}
    </>
  );
}
