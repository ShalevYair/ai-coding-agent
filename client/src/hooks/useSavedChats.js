import { useState } from 'react';
import axios from 'axios';

export function useSavedChats({ aiKey, githubToken, owner, selectedRepo }) {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [savedChats, setSavedChats] = useState([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [loadListLoading, setLoadListLoading] = useState(false);

  const authHeaders = { 'x-ai-key': aiKey, 'x-github-token': githubToken };

  const openSave = () => setShowSaveModal(true);

  const openLoad = async () => {
    setShowLoadModal(true);
    setLoadListLoading(true);
    try {
      const res = await axios.get('/api/saved-chats', {
        params: { owner, repo: selectedRepo },
        headers: authHeaders
      });
      setSavedChats(res.data.chats || []);
    } catch (e) {
      setSavedChats([]);
    }
    setLoadListLoading(false);
  };

  const saveChat = async (messages, saveType) => {
    setSaveLoading(true);
    try {
      const res = await axios.post('/api/save-chat', {
        messages, saveType, owner, repo: selectedRepo
      }, { headers: authHeaders });
      setShowSaveModal(false);
      return { success: true, title: res.data.title };
    } catch (e) {
      return { success: false, error: e.response?.data?.error || e.message };
    } finally {
      setSaveLoading(false);
    }
  };

  return {
    showSaveModal, setShowSaveModal, openSave,
    showLoadModal, setShowLoadModal, openLoad,
    savedChats, saveLoading, loadListLoading,
    saveChat
  };
}
