import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { useChat } from './hooks/useChat';
import { useProjectData } from './hooks/useProjectData';
import { useSavedChats } from './hooks/useSavedChats';

import { SideMenu } from './components/SideMenu';
import { ChatWindow } from './components/ChatWindow';
import { ChatInput } from './components/ChatInput';
import { SettingsModal } from './components/modals/SettingsModal';
import { ReadmeModal } from './components/modals/ReadmeModal';
import { ProjectMapModal } from './components/modals/ProjectMapModal';
import { PreviewModal } from './components/modals/PreviewModal';
import { SaveChatModal } from './components/modals/SaveChatModal';
import { LoadChatModal } from './components/modals/LoadChatModal';
import { ContextFilesModal } from './components/modals/ContextFilesModal';
import FileContentModal from './components/modals/FileContentModal';

import { RESPONSE_LENGTHS, AGENT_MODES, MEMORY_MODES, MAX_RETRIES_CYCLE, INITIAL_MESSAGE } from './utils/constants';

function App() {
  // ── Settings state ─────────────────────────────────────────────────────────
  const [showSettings, setShowSettings]   = useState(false);
  const [aiKey, setAiKey]                 = useState(localStorage.getItem('ai_key')        || '');
  const [githubToken, setGithubToken]     = useState(localStorage.getItem('gh_token')      || '');
  const [owner, setOwner]                 = useState(localStorage.getItem('owner')         || '');
  const [selectedRepo, setSelectedRepo]   = localStorage.getItem('selected_repo') ? useState(localStorage.getItem('selected_repo')) : useState('');
  const [repoList, setRepoList]           = useState([]);
  const [responseLength, setResponseLength] = useState(localStorage.getItem('response_length') || 'short');
  const [fontSize, setFontSize]           = useState(parseInt(localStorage.getItem('font_size') || '14', 10));

  // ── Side menu + new feature states ────────────────────────────────────────
  const [sideMenuOpen, setSideMenuOpen]   = useState(false);
  const [autoSave, setAutoSave]           = useState(localStorage.getItem('auto_save') !== 'false');
  const [agentMode, setAgentMode]         = useState(localStorage.getItem('agent_mode') || 'dove');
  const [memoryMode, setMemoryMode]       = useState(localStorage.getItem('memory_mode') || 'cat');
  const [maxRetries, setMaxRetries]       = useState(parseInt(localStorage.getItem('max_retries') || '3', 10));
  const [showContextFiles, setShowContextFiles] = useState(false);
  // מצבי קובץ לעריכה
  const [isFileContentModalOpen, setIsFileContentModalOpen] = useState(false);
  const [selectedFilePath, setSelectedFilePath] = useState('');
  const [selectedFileContent, setSelectedFileContent] = useState('');

  // ── Persist settings ───────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('ai_key',          aiKey);
    localStorage.setItem('gh_token',        githubToken);
    localStorage.setItem('owner',           owner);
    localStorage.setItem('selected_repo',   selectedRepo);
    if (githubToken && githubToken.length > 20 && repoList.length === 0) fetchGitHubData();
  }, [aiKey, githubToken, owner, selectedRepo, repoList.length]);

  useEffect(() => { localStorage.setItem('response_length', responseLength); }, [responseLength]);
  useEffect(() => { localStorage.setItem('font_size',       fontSize);        }, [fontSize]);
  useEffect(() => { localStorage.setItem('auto_save',       autoSave);        }, [autoSave]);
  useEffect(() => { localStorage.setItem('agent_mode',      agentMode);       }, [agentMode]);
  useEffect(() => { localStorage.setItem('memory_mode',     memoryMode);      }, [memoryMode]);
  useEffect(() => { localStorage.setItem('max_retries',     maxRetries);      }, [maxRetries]);

  useEffect(() => {
    if (!aiKey || !githubToken || !selectedRepo) setShowSettings(true);
  }, []);

  const fetchGitHubData = async () => {
    try {
      const res = await axios.get('/api/github/user-data', { headers: { 'x-github-token': githubToken } });
      setOwner(res.data.username);
      setRepoList(res.data.repos);
      if (!selectedRepo && res.data.repos.length > 0) setSelectedRepo(res.data.repos[0]);
    } catch (e) { console.error('GitHub Sync Error'); }
  };

  const cycleResponseLength = () => setResponseLength(prev => RESPONSE_LENGTHS[prev].next);
  const cycleAgentMode      = () => setAgentMode(prev => AGENT_MODES[prev].next);
  const cycleMemoryMode     = () => setMemoryMode(prev => MEMORY_MODES[prev].next);
  const cycleMaxRetries     = () => setMaxRetries(prev => MAX_RETRIES_CYCLE[prev] || 3);
  const changeFontSize      = (delta) => setFontSize(prev => Math.min(20, Math.max(11, prev + delta)));

  // ── Chat logic ─────────────────────────────────────────────────────────────
  const chat = useChat({ aiKey, githubToken, owner, selectedRepo, responseLength, agentMode, memoryMode, maxRetries });

  // ── Project data (README, project map) ────────────────────────────────────
  const projectData = useProjectData({ githubToken, owner, selectedRepo });

  // ── Saved chats ────────────────────────────────────────────────────────────
  const savedChats = useSavedChats({ aiKey, githubToken, owner, selectedRepo });

  // ── File editing logic ─────────────────────────────────────────────────────
  const handleOpenFileForEdit = async (filePath) => {
    try {
      const content = await chat.fetchFileContent(filePath);
      setSelectedFilePath(filePath);
      setSelectedFileContent(content);
      setIsFileContentModalOpen(true);
    } catch (error) {
      console.error('Error fetching file content for edit:', error);
      // ייתכן שתרצה להוסיף הודעת שגיאה למשתמש
    }
  };

  const handleSaveEditedFile = async (filePath, newContent) => {
    try {
      const plan = {
        action: 'edit_file',
        path: filePath,
        content: newContent,
      };
      await chat.handleExecutePlan(plan);
      setIsFileContentModalOpen(false); // סגור את המודל לאחר השמירה
      // ייתכן שתרצה להוסיף הודעת הצלחה או לרענן נתונים רלוונטיים
    } catch (error) {
      console.error('Error saving edited file:', error);
      // ייתכן שתרצה להוסיף הודעת שגיאה למשתמש
    }
  };

  // Auto-save current chat as summary, then clear session
  const autoSaveAndClear = async () => {
    if (chat.messages.length > 1) {
      await savedChats.saveChat(chat.messages, 'summary');
    }
    chat.clearSession();
  };

  const handleLoadChat = async (chatEntry) => {
    // Auto-save before loading if enabled
    if (autoSave && chat.messages.length > 1) {
      await savedChats.saveChat(chat.messages, 'summary');
    }
    if (chatEntry.type === 'summary') {
      const summaryMsg = { role: 'bot', text: `📂 שיחה טעונה — ${chatEntry.title}\n\n${chatEntry.content}` };
      chat.setMessages([INITIAL_MESSAGE, summaryMsg]);
    } else {
      const msgs = Array.isArray(chatEntry.content) ? chatEntry.content : [];
      chat.setMessages(msgs.length > 0 ? msgs : [INITIAL_MESSAGE]);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      width: '100vw', // Full width of the viewport
      height: '100dvh',
      display: 'flex',
      flexDirection: 'row',
      background: '#f1f5f9',
      overflow: 'hidden',
      direction: 'rtl'
    }}>

      {/* Right sidebar */}
      <SideMenu
        isOpen={sideMenuOpen}
        setIsOpen={setSideMenuOpen}
        messages={chat.messages}
        clearSession={chat.clearSession}
        compressSession={chat.compressSession}
        onOpenLoad={savedChats.openLoad}
        onOpenSave={savedChats.openSave}
        autoSaveAndClear={autoSaveAndClear}
        responseLength={responseLength}
        cycleResponseLength={cycleResponseLength}
        autoSave={autoSave}
        toggleAutoSave={() => setAutoSave(p => !p)}
        fetchProjectMap={projectData.fetchProjectMap}
        fetchReadme={projectData.fetchReadme}
        onOpenSettings={() => setShowSettings(true)}
        fontSize={fontSize}
        changeFontSize={changeFontSize}
        selectedRepo={selectedRepo}
        setSelectedRepo={setSelectedRepo}
        repoList={repoList}
        agentMode={agentMode}
        cycleAgentMode={cycleAgentMode}
        memoryMode={memoryMode}
        cycleMemoryMode={cycleMemoryMode}
        maxRetries={maxRetries}
        cycleMaxRetries={cycleMaxRetries}
        onUndo={chat.undoLastExecution}
        canUndo={chat.undoStack.length > 0}
        deepScanMode={chat.deepScanMode}
        toggleDeepScan={chat.toggleDeepScan}
        onOpenContextFiles={async () => { await projectData.ensureMapLoaded(); setShowContextFiles(true); }}
      />

      {/* Main content area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minWidth: 0,
        height: '100%'
      }}>

        {/* Mini header */}
        <div style={{
          padding: '10px 14px', background: '#fff',
          borderBottom: '1px solid #e2e8f0', flexShrink: 0
        }}>
          <h1 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0 }}>AI Coding Agent 🤖</h1>
          <div style={{ fontSize: '11px', color: '#3b82f6', fontWeight: '600' }}>
            {selectedRepo || 'בחר פרויקט בתפריט ←'}
          </div>
        </div>

        <ChatWindow
          messages={chat.messages}
          loading={chat.loading}
          fontSize={fontSize}
          executePlan={chat.executePlan}
          fetchPreview={chat.fetchPreview}
          answerAsk={chat.answerAsk}
        />

        <ChatInput
          loading={chat.loading}
          sendMessage={(text) => chat.sendMessage(text, chat.messages)}
          contextFiles={chat.contextFiles}
          toggleContextFile={chat.toggleContextFile}
          fontSize={fontSize}
          agentState={chat.agentState}
        />
      </div>

      {/* Modals */}
      {showSettings && (
        <SettingsModal
          aiKey={aiKey} setAiKey={setAiKey}
          githubToken={githubToken} setGithubToken={setGithubToken}
          owner={owner}
          onClose={() => setShowSettings(false)}
        />
      )}

      {projectData.showReadme && (
        <ReadmeModal
          content={projectData.readmeContent}
          loading={projectData.readmeLoading}
          selectedRepo={selectedRepo}
          onClose={() => projectData.setShowReadme(false)}
        />
      )}

      {projectData.showMap && (
        <ProjectMapModal
          mapData={projectData.mapData}
          mapLoading={projectData.mapLoading}
          mapRefreshing={projectData.mapRefreshing}
          selectedRepo={selectedRepo}
          selectedMapFile={projectData.selectedMapFile}
          setSelectedMapFile={projectData.setSelectedMapFile}
          contextFiles={chat.contextFiles}
          toggleContextFile={chat.toggleContextFile}
          onClose={projectData.closeMap}
          onRefresh={() => projectData.refreshProjectMap(aiKey)}
        />
      )}

      {chat.showPreview && (
        <PreviewModal
          previewData={chat.previewData}
          previewLoading={chat.previewLoading}
          previewFileIdx={chat.previewFileIdx}
          setPreviewFileIdx={chat.setPreviewFileIdx}
          previewTab={chat.previewTab}
          setPreviewTab={chat.setPreviewTab}
          executePlan={chat.executePlan}
          onClose={() => chat.setShowPreview(false)}
        />
      )}

      {savedChats.showSaveModal && (
        <SaveChatModal
          messages={chat.messages}
          saveLoading={savedChats.saveLoading}
          onSave={savedChats.saveChat}
          onClose={() => savedChats.setShowSaveModal(false)}
        />
      )}

      {savedChats.showLoadModal && (
        <LoadChatModal
          savedChats={savedChats.savedChats}
          loadListLoading={savedChats.loadListLoading}
          onLoad={handleLoadChat}
          onClose={() => savedChats.setShowLoadModal(false)}
        />
      )}

      {showContextFiles && (
        <ContextFilesModal
          contextFiles={chat.contextFiles}
          toggleContextFile={chat.toggleContextFile}
          allFiles={projectData.mapData?.files ? Object.keys(projectData.mapData.files) : []}
          selectedRepo={selectedRepo}
          onFileClick={handleOpenFileForEdit}
          onClose={() => setShowContextFiles(false)}
        />
      )}

      {isFileContentModalOpen && (
        <FileContentModal
          isOpen={isFileContentModalOpen}
          onClose={() => setIsFileContentModalOpen(false)}
          filePath={selectedFilePath}
          fileContent={selectedFileContent}
          onSave={handleSaveEditedFile}
        />
      )}
    </div>
  );
}

export default App;