import { useState, useEffect } from 'react';
import axios from 'axios';
import { INITIAL_MESSAGE, loadSavedMessages } from '../utils/constants';

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

export function useChat({ aiKey, githubToken, owner, selectedRepo, responseLength }) {
  const [messages, setMessages] = useState(loadSavedMessages);
  const [loading, setLoading] = useState(false);
  const [pendingPlan, setPendingPlan] = useState(null);
  const [contextFiles, setContextFiles] = useState([]);

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

  const _doChat = async (prompt, historySnapshot) => {
    try {
      const res = await axios.post('/api/chat', {
        prompt,
        history: historySnapshot,
        context: { owner, repo: selectedRepo },
        responseLength,
        contextFiles
      }, { headers: authHeaders });
      _applyResponse(parseAIResponse(res.data.response));
    } catch (e) {
      const errorMsg = e.response?.data?.error || e.message;
      setMessages(prev => [...prev, { role: 'bot', text: `❌ שגיאה: ${errorMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (text, currentMessages) => {
    if (!text.trim() || loading) return;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setLoading(true);
    await _doChat(text, currentMessages);
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
    showPreview, setShowPreview,
    previewData, previewLoading,
    previewFileIdx, setPreviewFileIdx,
    previewTab, setPreviewTab
  };
}
