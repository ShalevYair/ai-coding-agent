import { useState, useEffect, useRef } from 'react';
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

export function useChat({ aiKey, githubToken, owner, selectedRepo, responseLength, agentMode = 'dove', memoryMode = 'cat', maxRetries = 3, ttsEnabled }) {
  const [messages, setMessages] = useState(loadSavedMessages);
  const [loading, setLoading] = useState(false);
  const [pendingPlan, setPendingPlan] = useState(null);
  const [contextFiles, setContextFiles] = useState([]);
  const [deepScanMode, setDeepScanMode] = useState(false);

  // Agent multi-step state: null | { step: number, totalSteps: number, refinedPrompt: string }
  const [agentState, setAgentState] = useState(null);

  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewFileIdx, setPreviewFileIdx] = useState(0);
  const [previewTab, setPreviewTab] = useState('after');

  // Tracks which owner/repo combos were already checked for missing files
  const checkedReposRef = useRef(new Set());

  useEffect(() => {
    try { localStorage.setItem('chat_messages', JSON.stringify(messages)); } catch (e) {}
  }, [messages]);

  // Check for missing project_map.json and Gemini.md at the start of each new repo session
  useEffect(() => {
    if (!selectedRepo || !owner || !aiKey || !githubToken) return;
    const key = `${owner}/${selectedRepo}`;
    if (checkedReposRef.current.has(key)) return;
    checkedReposRef.current.add(key);
    checkMissingFiles(owner, selectedRepo);
  }, [selectedRepo, owner, aiKey, githubToken]);

  const speakHebrew = (text) => {
    if (!window.speechSynthesis || !text) return;
    const noMarkdown = text.replace(/[\s\S]*?/g, '');
    const words = noMarkdown.split(/\s+/);
    const hebrewOnly = words.filter(word => /[\u0590-\u05FF]/.test(word)).join(' ');
    if (!hebrewOnly.trim()) return;

    const utterance = new SpeechSynthesisUtterance(hebrewOnly);
    utterance.lang = 'he-IL';
    window.speechSynthesis.speak(utterance);
  };

  const clearSession = () => {
    setMessages([INITIAL_MESSAGE]);
    setPendingPlan(null);
    setContextFiles([]);
    setAgentState(null);
  };

  const toggleContextFile = (path) =>
    setContextFiles(prev => prev.includes(path) ? prev.filter(f => f !== path) : [...prev, path]);

  const authHeaders = { 'x-ai-key': aiKey, 'x-github-token': githubToken };

  const checkMissingFiles = async (repoOwner, repoName) => {
    try {
      const [mapResult, geminiResult] = await Promise.allSettled([
        axios.get('/api/file', { params: { owner: repoOwner, repo: repoName, path: 'project_map.json' }, headers: { 'x-github-token': githubToken } }),
        axios.get('/api/file', { params: { owner: repoOwner, repo: repoName, path: 'Gemini.md' }, headers: { 'x-github-token': githubToken } })
      ]);

      const mapMissing = mapResult.status === 'rejected' || !mapResult.value?.data?.content;
      const geminiMissing = geminiResult.status === 'rejected' || !geminiResult.value?.data?.content;

      if (mapMissing) {
        setMessages(prev => [...prev, {
          role: 'bot',
          text: '📋 לא נמצא קובץ project_map.json בפרויקט זה.',
          hasAsk: true,
          askData: {
            question: 'האם לסרוק את הפרויקט ולצור מפת קבצים עדכנית?',
            options: ['כן, סרוק ועדכן', 'לא תודה'],
            _action: 'scan-project'
          }
        }]);
      }

      if (geminiMissing) {
        setMessages(prev => [...prev, {
          role: 'bot',
          text: '📄 לא נמצא קובץ Gemini.md (מדריך הפרויקט לסוכן).',
          hasAsk: true,
          askData: {
            question: 'האם לנתח את הפרויקט ולצור קובץ Gemini.md?',
            options: ['כן, צור Gemini.md', 'לא תודה'],
            _action: 'create-gemini-md'
          }
        }]);
      }
    } catch (e) { /* silent — don't disrupt startup */ }
  };

  const handleSpecialAction = async (action) => {
    try {
      if (action === 'scan-project') {
        setMessages(prev => [...prev, { role: 'bot', text: '⏳ סורק את הפרויקט ומעדכן מפת קבצים...' }]);
        await axios.post('/api/scan-project', { context: { owner, repo: selectedRepo } }, { headers: authHeaders });
        setMessages(prev => [...prev, { role: 'bot', text: '✅ מפת הפרויקט (project_map.json) עודכנה בהצלחה!' }]);
      } else if (action === 'create-gemini-md') {
        setMessages(prev => [...prev, { role: 'bot', text: '⏳ מנתח את הפרויקט ויוצר Gemini.md — זה עשוי לקחת כמה שניות...' }]);
        await axios.post('/api/create-gemini-md', { context: { owner, repo: selectedRepo } }, { headers: authHeaders });
        setMessages(prev => [...prev, { role: 'bot', text: '✅ קובץ Gemini.md נוצר בהצלחה! הסוכן יקרא אותו מעתה בכל שיחה.' }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'bot', text: `❌ שגיאה: ${e.response?.data?.error || e.message}` }]);
    }
    setLoading(false);
  };

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

  const _doChat = async (prompt, historySnapshot, extraFiles = []) => {
    const usedDeepScan = deepScanMode;
    if (usedDeepScan) setDeepScanMode(false);
    try {
      const effectiveFiles = [...new Set([..._effectiveContextFiles(), ...extraFiles])];
      const res = await axios.post('/api/chat', {
        prompt,
        history: _sliceHistory(historySnapshot),
        context: { owner, repo: selectedRepo },
        responseLength,
        contextFiles: effectiveFiles,
        deepScan: usedDeepScan
      }, { headers: authHeaders });
      const aiRes = res.data.response;
      const parsed = parseAIResponse(aiRes);

      // Auto-load requested files silently, then retry once
      if (parsed.type === 'ask' && parsed.askData?._action === 'add-files-to-context' && extraFiles.length === 0) {
        const files = parsed.askData.files || [];
        if (files.length > 0) {
          setContextFiles(prev => [...new Set([...prev, ...files])]);
          setMessages(prev => [...prev, { role: 'bot', text: `📎 טוען קבצים לקונטקסט: ${files.join(', ')}` }]);
          await _doChat(prompt, historySnapshot, files);
          return;
        }
      }

      _applyResponse(parsed);
      if (ttsEnabled) speakHebrew(aiRes);
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
        if (ttsEnabled) speakHebrew(refined2);
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
      if (ttsEnabled) speakHebrew(refined);
      setAgentState({ step: 1, totalSteps, refinedPrompt: refined });
      setLoading(false);
    }
  };

  const answerAsk = async (option, currentMessages, askData) => {
    setMessages(prev => [...prev, { role: 'user', text: option }]);

    // Handle special system actions (scan-project, create-gemini-md)
    if (askData?._action) {
      const isPositive = !option.includes('לא');
      if (isPositive) {
        setLoading(true);
        await handleSpecialAction(askData._action);
      }
      return;
    }

    setLoading(true);
    await _doChat(option, currentMessages);
  };

  const executePlan = async () => {
    if (!pendingPlan) return;
    setLoading(true);

    let lastError = null;
    const effectiveRetries = maxRetries || 1;

    for (let attempt = 1; attempt <= effectiveRetries; attempt++) {
      try {
        if (attempt > 1) {
          setMessages(prev => [...prev, {
            role: 'bot',
            text: `🔄 ניסיון תיקון ${attempt}/${effectiveRetries}...`
          }]);
          // Exponential backoff between retries
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }

        await axios.post('/api/execute', {
          plan: pendingPlan,
          context: { owner, repo: selectedRepo }
        }, { headers: authHeaders });

        setMessages(prev => [...prev, { role: 'bot', text: '✅ בוצע! השינויים נדחפו לגיטהאב.' }]);
        setPendingPlan(null);
        setLoading(false);
        return;
      } catch (e) {
        lastError = e.response?.data?.error || e.message;
      }
    }

    const retryNote = effectiveRetries > 1 ? ` (לאחר ${effectiveRetries} ניסיונות)` : '';
    setMessages(prev => [...prev, { role: 'bot', text: `❌ שגיאה בביצוע${retryNote}: ${lastError}` }]);
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
    deepScanMode, toggleDeepScan: () => setDeepScanMode(prev => !prev),
    clearSession, toggleContextFile, compressSession,
    sendMessage, answerAsk, executePlan, fetchPreview,
    agentState,
    showPreview, setShowPreview,
    previewData, previewLoading,
    previewFileIdx, setPreviewFileIdx,
    previewTab, setPreviewTab
  };
}