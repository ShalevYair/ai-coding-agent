import React from 'react';
import { Settings } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { RESPONSE_LENGTHS } from '../utils/constants';
import { iconBtn } from '../utils/theme';

export function Header({
  selectedRepo, responseLength, cycleResponseLength,
  fontSize, changeFontSize,
  clearSession, compressSession, onOpenSave, onOpenLoad,
  fetchReadme, fetchProjectMap, onOpenSettings
}) {
  return (
    <div style={{
      padding: '10px 14px', background: '#fff',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      flexShrink: 0
    }}>
      <div>
        <h1 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0 }}>AI Coding Agent 🤖</h1>
        <div style={{ fontSize: '11px', color: '#3b82f6', fontWeight: '600' }}>
          {selectedRepo || 'בחר פרויקט...'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
        <Tooltip text="שיחה חדשה">
          <button style={{ ...iconBtn, color: '#64748b' }} onClick={clearSession}>🗑️</button>
        </Tooltip>
        <Tooltip text="דחוס שיחה">
          <button style={iconBtn} onClick={compressSession}>🗜️</button>
        </Tooltip>
        <Tooltip text="שמור שיחה">
          <button style={iconBtn} onClick={onOpenSave}>💾</button>
        </Tooltip>
        <Tooltip text="טען שיחה">
          <button style={iconBtn} onClick={onOpenLoad}>📂</button>
        </Tooltip>
        <Tooltip text={RESPONSE_LENGTHS[responseLength].label}>
          <button style={iconBtn} onClick={cycleResponseLength}>
            {RESPONSE_LENGTHS[responseLength].icon}
          </button>
        </Tooltip>
        <Tooltip text="הקטן גופן">
          <button style={{ ...iconBtn, fontSize: '15px', fontWeight: 'bold', color: '#64748b' }} onClick={() => changeFontSize(-1)}>−</button>
        </Tooltip>
        <Tooltip text="הגדל גופן">
          <button style={{ ...iconBtn, fontSize: '15px', fontWeight: 'bold', color: '#64748b' }} onClick={() => changeFontSize(+1)}>+</button>
        </Tooltip>
        <Tooltip text="עזרה / README">
          <button style={iconBtn} onClick={fetchReadme}>❓</button>
        </Tooltip>
        <Tooltip text="מפת פרויקט">
          <button style={iconBtn} onClick={fetchProjectMap}>🗺️</button>
        </Tooltip>
        <Tooltip text="הגדרות">
          <button style={{ ...iconBtn, color: '#64748b' }} onClick={onOpenSettings}>
            <Settings size={18} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
