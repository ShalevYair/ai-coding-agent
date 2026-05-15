export const RESPONSE_LENGTHS = {
  short:  { icon: '🐆', label: 'תשובות קצרות',  next: 'normal' },
  normal: { icon: '🐴', label: 'תשובות רגילות', next: 'long'   },
  long:   { icon: '🐢', label: 'תשובות ארוכות', next: 'short'  }
};

export const AGENT_MODES = {
  dove:  { icon: '🕊️', label: 'בינה רגילה',     totalSteps: 1, next: 'raven' },
  raven: { icon: '🐦', label: 'בינה כפולה',     totalSteps: 2, next: 'owl'   },
  owl:   { icon: '🦉', label: 'בינה משולשת',    totalSteps: 3, next: 'dove'  }
};

export const MEMORY_MODES = {
  cat:      { icon: '🐱', label: 'זיכרון קצר (8)',      messages: 8,  useContext: true,  next: 'elephant' },
  elephant: { icon: '🐘', label: 'זיכרון ארוך (16)',     messages: 16, useContext: true,  next: 'goldfish' },
  goldfish: { icon: '🐟', label: 'זיכרון מינימלי (3)',   messages: 3,  useContext: false, next: 'cat'      }
};

export const INITIAL_MESSAGE = { role: 'bot', text: 'היי! אני מוכן. מה בונים היום?' };

export function loadSavedMessages() {
  try {
    const saved = localStorage.getItem('chat_messages');
    return saved ? JSON.parse(saved) : [INITIAL_MESSAGE];
  } catch (e) { return [INITIAL_MESSAGE]; }
}
