import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { useChat } from './hooks/useChat';
import { useProjectData } from './hooks/useProjectData';
import { useSavedChats } from './hooks/useSavedChats';

import { Header } from './components/Header';
import { ChatWindow } from './components/ChatWindow';
import { ChatInput } from './components/ChatInput';
import { SettingsModal } from './components/modals/SettingsModal';
import { ReadmeModal } from './components/modals/ReadmeModal';
import { ProjectMapModal } from './components/modals/ProjectMapModal';
import { PreviewModal } from './components/modals/PreviewModal';
import { SaveChatModal } from './components/modals/SaveChatModal';
import { LoadChatModal } from './components/modals/LoadChatModal';

import { RESPONSE_LENGTHS, INITIAL_MESSAGE } from './utils/constants';

function App() {
  // ── Settings state ─────────────────────────────────────────────────────────
  const [showSettings, setShowSettings] = useState(false);
  const [aiKey, setAiKey]               = useState(localStorage.getItem('ai_key')       || '');
  const [githubToken, setGithubToken]   = useState(localStorage.getItem('gh_token')     || '');
  const [owner, setOwner]               = useState(localStorage.getItem('owner')        || '');
  const [selectedRepo, setSelectedRepo] = useState(localStorage.getItem('selected_repo')|| '');
  const [repoList, setRepoList]         = useState([]);
  const [responseLength, setResponseLength] = useState(localStorage.getItem('response_length') || 'short');
  const [fontSize, setFontSize]         = useState(parseInt(localStorage.getItem('font_size') || '14', 10));

  // ── Persist settings ───────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('ai_key',          aiKey);
    localStorage.setItem('gh_token',        githubToken);
    localStorage.setItem('owner',           owner);
    localStorage.setItem('selected_repo',   selectedRepo);
    if (githubToken && githubToken.length > 20 && repoList.length === 0) fetchGitHubData();
  }, [aiKey, githubToken, owner, selectedRepo, repoList.length]);

  useEffect(() => { localStorage.setItem('response_length', responseLength); }, [responseLength]);
  useEffect(() => { localStorage.setItem('font_size', fontSize); },           [fontSize]);

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
  const changeFontSize = (delta) => setFontSize(prev => Math.min(20, Math.max(11, prev + delta)));

  // ── Chat logic ─────────────────────────────────────────────────────────────
  const chat = useChat({ aiKey, githubToken, owner, selectedRepo, responseLength });

  // ── Project data (README, project map) ────────────────────────────────────
  const projectData = useProjectData({ githubToken, owner, selectedRepo });

  // ── Saved chats ────────────────────────────────────────────────────────────
  const savedChats = useSavedChats({ aiKey, githubToken, owner, selectedRepo });

  const handleLoadChat = (chatEntry) => {
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
      maxWidth: '600px', margin: '0 auto',
      height: '100dvh', display: 'flex', flexDirection: 'column',
      background: '#f1f5f9', overflow: 'hidden'
    }} dir="rtl">

      <Header
        selectedRepo={selectedRepo}
        responseLength={responseLength}
        cycleResponseLength={cycleResponseLength}
        fontSize={fontSize}
        changeFontSize={changeFontSize}
        clearSession={chat.clearSession}
        compressSession={chat.compressSession}
        onOpenSave={savedChats.openSave}
        onOpenLoad={savedChats.openLoad}
        fetchReadme={projectData.fetchReadme}
        fetchProjectMap={projectData.fetchProjectMap}
        onOpenSettings={() => setShowSettings(true)}
      />

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
      />

      {showSettings && (
        <SettingsModal
          aiKey={aiKey} setAiKey={setAiKey}
          githubToken={githubToken} setGithubToken={setGithubToken}
          owner={owner}
          selectedRepo={selectedRepo} setSelectedRepo={setSelectedRepo}
          repoList={repoList}
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
          selectedRepo={selectedRepo}
          selectedMapFile={projectData.selectedMapFile}
          setSelectedMapFile={projectData.setSelectedMapFile}
          contextFiles={chat.contextFiles}
          toggleContextFile={chat.toggleContextFile}
          onClose={projectData.closeMap}
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
    </div>
  );
}

export default App;
