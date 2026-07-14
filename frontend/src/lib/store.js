// Zustand stores — chat, auth, and theme state management
import { create } from 'zustand';
import { conversationAPI } from './api';

// ── Theme Store ──────────────────────────────────────────────
export const useThemeStore = create((set) => {
  const saved = localStorage.getItem('fs_theme') || 'dark';
  // Apply on init
  if (saved === 'light') document.body.classList.add('light');
  return {
    theme: saved,
    toggleTheme: () => set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      document.body.classList.toggle('light', next === 'light');
      localStorage.setItem('fs_theme', next);
      return { theme: next };
    }),
  };
});

// ── Auth Store ───────────────────────────────────────────────
export const useAuthStore = create((set) => ({
  token: localStorage.getItem('fs_token') || null,
  user: JSON.parse(localStorage.getItem('fs_user') || 'null'),
  isAuthenticated: !!localStorage.getItem('fs_token'),

  login: (token, user) => {
    localStorage.setItem('fs_token', token);
    localStorage.setItem('fs_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('fs_token');
    localStorage.removeItem('fs_user');
    set({ token: null, user: null, isAuthenticated: false });
  },
}));

// ── Chat Store ───────────────────────────────────────────────
export const useChatStore = create((set, get) => ({
  sessionId: localStorage.getItem('fs_session') || crypto.randomUUID(),
  conversationId: null,
  messages: [],
  isTyping: false,
  isStreaming: false,
  streamingMessageId: null,
  quickReplies: [],
  isEscalated: false,
  escalationData: null,
  conversations: [],
  smartPanelSources: [],
  currentSentiment: 0,

  initSession: () => {
    const sid = get().sessionId;
    localStorage.setItem('fs_session', sid);
  },

  setConversationId: (id) => set({ conversationId: id }),

  addMessage: (msg) => set((state) => ({
    messages: [...state.messages, {
      ...msg,
      id: msg.id || crypto.randomUUID(),
      timestamp: msg.timestamp || new Date().toISOString(),
      title: msg.title || undefined,
    }],
  })),

  setSmartPanelSources: (sources) => set({ smartPanelSources: sources }),

  setCurrentSentiment: (sentiment) => set({ currentSentiment: sentiment }),

  loadConversations: async () => {
    try {
      const res = await conversationAPI.list();
      set({ conversations: res.data });
    } catch (err) {
      console.warn('Failed to load conversations:', err);
    }
  },

  startStreaming: (messageId) => set({
    isStreaming: true,
    streamingMessageId: messageId,
    isTyping: false,
  }),

  appendStreamChunk: (messageId, chunk) => set((state) => {
    const msgs = [...state.messages];
    const idx = msgs.findIndex(m => m.id === messageId);
    if (idx >= 0) {
      msgs[idx] = { ...msgs[idx], content: msgs[idx].content + chunk };
    } else {
      msgs.push({ id: messageId, role: 'bot', content: chunk, timestamp: new Date().toISOString() });
    }
    return { messages: msgs };
  }),

  finishStreaming: (messageId, metadata) => set((state) => {
    const msgs = [...state.messages];
    const idx = msgs.findIndex(m => m.id === messageId);
    if (idx >= 0 && metadata) {
      msgs[idx] = { ...msgs[idx], sources: metadata.sources, confidence: metadata.confidence };
    }
    return {
      messages: msgs,
      isStreaming: false,
      streamingMessageId: null,
      quickReplies: metadata?.quickReplies || [],
      smartPanelSources: metadata?.sources || state.smartPanelSources,
      currentSentiment: metadata?.sentiment !== undefined ? metadata.sentiment : state.currentSentiment,
    };
  }),

  setTyping: (typing) => set({ isTyping: typing }),

  setEscalation: (data) => set({
    isEscalated: true,
    escalationData: data,
    isStreaming: false,
    isTyping: false,
  }),

  setQuickReplies: (replies) => set({ quickReplies: replies }),

  newConversation: () => set({
    conversationId: null,
    messages: [],
    isTyping: false,
    isStreaming: false,
    quickReplies: [],
    isEscalated: false,
    escalationData: null,
    smartPanelSources: [],
    currentSentiment: 0,
  }),

  setConversations: (conversations) => set({ conversations }),
}));
