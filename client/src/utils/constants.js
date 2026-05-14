export const RESPONSE_LENGTHS = {
  short:  { icon: '⚡', label: 'תשובות קצרות',  next: 'normal' },
  normal: { icon: '🐴', label: 'תשובות רגילות', next: 'long'   },
  long:   { icon: '🐢', label: 'תשובות ארוכות', next: 'short'  }
};

export const INITIAL_MESSAGE = { role: 'bot', text: 'היי! אני מוכן. מה בונים היום?' };

export function loadSavedMessages() {
  try {
    const saved = localStorage.getItem('chat_messages');
    return saved ? JSON.parse(saved) : [INITIAL_MESSAGE];
  } catch (e) { return [INITIAL_MESSAGE]; }
}
