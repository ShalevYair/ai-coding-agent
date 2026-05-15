import { useState, useEffect } from 'react';
import axios from 'axios';
import { INITIAL_MESSAGE, loadSavedMessages, AGENT_MODES, MEMORY_MODES } from '../utils/constants';

function parseAIResponse(aiRes) {
  const askMatch = aiRes.match(/\[\[\[ASK\]\]\]([\s\S]*?)\[\[\[\/ASK\]\]\]/);
  if (askMatch) {
    try {
      const askData = JSON.parse(askMatch[1].trim());
      const cleanText = aiRes.replace(/\[\[\[ASK\]\]\][\s\S]*?\[\[\[\/ASK\]\]\]/, '').trim();
      return { type: 'ask', cleanText, askData };
    } catch (e) {}
  }
  const planMatch = aiRes.match(/\[\[\[(?!ASK)([\s\S]*?)\]\]\]/);
  if (planMatch) {
    try {
      const planData = JSON.parse(planMatch[1]);
      const finalPlan = Array.isArray(planData) ? planData : [planData];
      const cleanText = aiRes.replace(/\[\[\[[\s\S]*?\]\]\]/, '').trim();
      return { type: 'plan', cleanText, finalPlan };
    } catch (e) {}
  }
  return { type: 'text', text: aiRes };
}

export function useChat({ aiKey, githubToken, owner, selectedRepo, responseLength, agentMode = 'dove', memoryMode = 'cat' }) {
  const [messages, setMessages] = useState(loadSavedMessages);
  const [loading, setLoading] = useState(false);
  const [pendingPlan, setPendingPlan] = useState(null);
  const [contextFiles, setContextFiles] = useState([]);

  // Agent multi-step state: null | { step: number, totalSteps: number, refinedPrompt: string }
  const [agentState, setAgentState] = useState(null);

  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewFileIdx, setPreviewFileIdx] = useState(0);
  const [previewTab, setPreviewTab] = useState('after');

  useEffect(() => {
    try { localStorage.setItem('chat_messages', JSON.stringify(messages)); } catch (e) {}
  }, [messages]);

  const clearSession = () => {
    setMessages([INITIAL_MESSAGE]);
    setPendingPlan(null);
    setContextFiles([]);
    setAgentState(null);
  };

  const toggleContextFile = (path) =>
    setContextFiles(prev => prev.includes(path) ? prev.filter(f => f !== path) : [...prev, path]);

  const authHeaders = { 'x-ai-key': aiKey, 'x-github-token': githubToken };

  const _applyResponse = (parsed) => {
    if (parsed.type === 'ask') {
      setMessages(prev => [...prev, { role: 'bot', text: parsed.cleanText, hasAsk: true, askData: parsed.askData }]);
    } else if (parsed.type === 'plan') {
      setPendingPlan(parsed.finalPlan);
      setMessages(prev => [...prev, { role: 'bot', text: parsed.cleanText, hasPlan: true, plan: parsed.finalPlan }]);
    } else {
      setMessages(prev => [...prev, { role: 'bot', text: parsed.text }]);
    }
  };

  // Slice history according to memoryMode
  const _sliceHistory = (history) => {
    const cfg = MEMORY_MODES[memoryMode] || MEMORY_MODES.cat;
    return history.slice(-cfg.messages);
  };

  // Effective context files: goldfish mode ignores pinned context
  const _effectiveContextFiles = () => {
    const cfg = MEMORY_MODES[memoryMode] || MEMORY_MODES.cat;
    return cfg.useContext ? contextFiles : [];
  };

  const _doChat = async (prompt, historySnapshot) => {
    try {
      const res = await axios.post('/api/chat', {
        prompt,
        history: _sliceHistory(historySnapshot),
        context: { owner, repo: selectedRepo },
        responseLength,
        contextFiles: _effectiveContextFiles()
      }, { headers: authHeaders });
      _applyResponse(parseAIResponse(res.data.response));
    } catch (e) {
      const errorMsg = e.response?.data?.error || e.message;
      setMessages(prev => [...prev, { role: 'bot', text: `❌ שגיאה: ${errorMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  // Refine a prompt via the backend (for raven/owl agent modes)
  const _doRefine = async (prompt, historySnapshot) => {
    try {
      const res = await axios.post('/api/refine-prompt', {
        prompt,
        history: _sliceHistory(historySnapshot),
        context: { owner, repo: selectedRepo },
      }, { headers: authHeaders });
      return res.data.refinedPrompt || prompt;
    } catch (e) {
      return prompt;
    }
  };

  const sendMessage = async (text, currentMessages) => {
    if (!text.trim() && !agentState) return;
    if (loading) return;

    const totalSteps = AGENT_MODES[agentMode]?.totalSteps || 1;

    // Step continuation: user accepted/modified refined prompt
    if (agentState) {
      const userInput = text.trim();
      const basePrompt = agentState.refinedPrompt;
      // Combine refined prompt with user's modifications
      const combinedPrompt = userInput
        ? `${basePrompt}\n\nשינויים למשתמש: ${userInput}`
        : basePrompt;

      const displayText = userInput || '(אשרתי את הפרומט המוצע)';
      setMessages(prev => [...prev, { role: 'user', text: displayText }]);
      setLoading(true);

      const nextStep = agentState.step + 1;

      if (nextStep < totalSteps) {
        // Another refinement step (owl step 2)
        const refined2 = await _doRefine(combinedPrompt, currentMessages);
        setMessages(prev => [...prev, {
          role: 'bot',
          text: `✨ פרומט מעודכן (שלב ${nextStep}/${totalSteps}):\n\n${refined2}`
        }]);
        setAgentState({ step: nextStep, totalSteps, refinedPrompt: refined2 });
        setLoading(false);
      } else {
        // Final step — send for real answer
        setAgentState(null);
        await _doChat(combinedPrompt, currentMessages);
      }
      return;
    }

    // Normal first send
    setMessages(prev => [...prev, { role: 'user', text }]);
    setLoading(true);

    if (totalSteps === 1) {
      // Dove mode — direct answer
      await _doChat(text, currentMessages);
    } else {
      // Raven/owl — first refine the prompt
      const refined = await _doRefine(text, currentMessages);
      setMessages(prev => [...prev, {
        role: 'bot',
        text: `✨ פרומט מוצע (שלב 1/${totalSteps}):\n\n${refined}`
      }]);
      setAgentState({ step: 1, totalSteps, refinedPrompt: refined });
      setLoading(false);
    }
  };

  const answerAsk = async (option, currentMessages) => {
    setMessages(prev => [...prev, { role: 'user', text: option }]);
    setLoading(true);
    await _doChat(option, currentMessages);
  };

  const executePlan = async () => {
    if (!pendingPlan) return;
    setLoading(true);
    try {
      await axios.post('/api/execute', {
        plan: pendingPlan,
        context: { owner, repo: selectedRepo }
      }, { headers: authHeaders });
      setMessages(prev => [...prev, { role: 'bot', text: '✅ בוצע! השינויים נדחפו לגיטהאב.' }]);
      setPendingPlan(null);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'bot', text: `❌ שגיאה בביצוע: ${e.message}` }]);
    }
    setLoading(false);
  };

  const compressSession = async () => {
    if (loading || messages.length < 2) return;
    setLoading(true);
    try {
      const res = await axios.post('/api/compress', { messages }, { headers: authHeaders });
      const summaryMsg = { role: 'bot', text: `🗜️ סיכום השיחה:\n\n${res.data.summary}` };
      setMessages([INITIAL_MESSAGE, summaryMsg]);
      setPendingPlan(null);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'bot', text: `❌ שגיאת דחיסה: ${e.response?.data?.error || e.message}` }]);
    }
    setLoading(false);
  };

  const fetchPreview = async (plan) => {
    setShowPreview(true);
    setPreviewLoading(true);
    setPreviewFileIdx(0);
    setPreviewTab('after');
    try {
      const res = await axios.post('/api/preview', {
        plan,
        context: { owner, repo: selectedRepo }
      }, { headers: authHeaders });
      setPreviewData(res.data.previews || []);
    } catch (e) {
      setPreviewData([{ file: 'שגיאה', current: '', proposed: e.response?.data?.error || e.message }]);
    }
    setPreviewLoading(false);
  };

  return {
    messages, setMessages, loading, pendingPlan, contextFiles,
    clearSession, toggleContextFile, compressSession,
    sendMessage, answerAsk, executePlan, fetchPreview,
    agentState,
    showPreview, setShowPreview,
    previewData, previewLoading,
    previewFileIdx, setPreviewFileIdx,
    previewTab, setPreviewTab
  };
}
