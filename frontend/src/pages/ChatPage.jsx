import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, PanelRightOpen, PanelRightClose, ArrowLeft, Globe } from 'lucide-react';
import { useChatStore, useThemeStore } from '../lib/store';
import { getSocket } from '../lib/socket';
import MessageBubble from '../components/chat/MessageBubble';
import TypingIndicator from '../components/chat/TypingIndicator';
import QuickReplies from '../components/chat/QuickReplies';
import InputBar from '../components/chat/InputBar';
import EscalationBanner from '../components/chat/EscalationBanner';
import ChatSidebar from '../components/chat/ChatSidebar';
import SmartPanel from '../components/chat/SmartPanel';
import Logo from '../components/ui/Logo';
import ThemeToggle from '../components/ui/ThemeToggle';

export default function ChatPage() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [smartPanelOpen, setSmartPanelOpen] = useState(true);
  const [language, setLanguage] = useState('English');

  const {
    sessionId, conversationId, messages, isTyping, isStreaming,
    quickReplies, isEscalated, escalationData, smartPanelSources,
    initSession, setConversationId, addMessage, startStreaming,
    appendStreamChunk, finishStreaming, setTyping, setEscalation,
  } = useChatStore();
  const theme = useThemeStore((s) => s.theme);

  // Initialize socket connection
  useEffect(() => {
    initSession();
    const socket = getSocket();

    socket.on('chat:typing', () => {
      useChatStore.getState().setTyping(true);
    });

    socket.on('chat:stream', (data) => {
      const store = useChatStore.getState();

      if (data.conversationId && !store.conversationId) {
        store.setConversationId(data.conversationId);
      }
      
      if (data.isComplete) {
        store.finishStreaming(data.messageId, {
          sources: data.sources,
          quickReplies: data.quickReplies,
          confidence: data.confidence,
          sentiment: data.sentiment,
        });

        // Handle agent messages
        if (data.isAgent) {
          store.addMessage({
            id: data.messageId,
            role: 'agent',
            content: data.chunk,
            agentName: data.agentName,
          });
        }
      } else {
        if (!store.isStreaming) store.startStreaming(data.messageId);
        store.appendStreamChunk(data.messageId, data.chunk);
      }
    });

    socket.on('chat:escalation', (data) => {
      useChatStore.getState().setEscalation(data);
    });

    socket.on('chat:agentJoined', (data) => {
      useChatStore.getState().addMessage({
        role: 'bot',
        content: `**${data.agentName}** has joined the conversation. You're now speaking with a human agent.`,
      });
    });

    socket.on('chat:error', (data) => {
      const store = useChatStore.getState();
      store.addMessage({ role: 'bot', content: data.message || 'An error occurred. Please try again.' });
      store.setTyping(false);
    });

    socket.on('chat:conversationList', (data) => {
      useChatStore.getState().setConversations(data);
    });

    return () => {
      socket.off('chat:typing');
      socket.off('chat:stream');
      socket.off('chat:escalation');
      socket.off('chat:agentJoined');
      socket.off('chat:error');
      socket.off('chat:conversationList');
    };
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = useCallback((text) => {
    const store = useChatStore.getState();
    store.addMessage({ role: 'user', content: text });
    store.setTyping(true);

    const socket = getSocket();
    socket.emit('chat:message', {
      message: text,
      sessionId: store.sessionId,
      conversationId: store.conversationId,
      language: language !== 'English' ? language : undefined,
    });
  }, [language]);

  return (
    <div className="h-screen flex flex-col theme-bg">
      {/* Header */}
      <header className="px-4 py-3 flex items-center gap-3 shrink-0 theme-header">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-1 cursor-pointer" aria-label="Toggle sidebar">
          <Menu size={20} className="theme-text-primary" />
        </button>
        <button onClick={() => navigate('/')} className="p-1 cursor-pointer" aria-label="Back to home">
          <ArrowLeft size={20} className="theme-text-primary" />
        </button>
        <div className="flex-1">
          <Logo size="sm" />
        </div>
        <button
          onClick={() => setSmartPanelOpen(!smartPanelOpen)}
          className="hidden lg:block p-1 cursor-pointer theme-text-secondary hover:opacity-80"
          aria-label="Toggle smart panel"
        >
          {smartPanelOpen ? <PanelRightClose size={20} className="theme-text-primary" /> : <PanelRightOpen size={20} className="theme-text-primary" />}
        </button>
        <div className="flex items-center gap-1 theme-input rounded-lg px-2 py-1">
          <Globe size={14} className="theme-text-primary" />
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-transparent text-xs font-semibold theme-text-primary outline-none cursor-pointer"
            aria-label="Language selection"
          >
            {[
              ['English', 'EN'], ['Spanish', 'ES'], ['French', 'FR'],
              ['German', 'DE'], ['Hindi', 'HI'], ['Japanese', 'JA'],
            ].map(([val, label]) => (
              <option key={val} value={val} style={{
                backgroundColor: theme === 'light' ? '#FFFFFF' : '#0B0E1A',
                color: theme === 'light' ? '#1e293b' : '#E2E8F0',
              }}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <ThemeToggle />
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden theme-bg">
        {/* Sidebar */}
        <ChatSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0 theme-chat shadow-2xl relative z-0">
          {/* Escalation banner */}
          <EscalationBanner data={escalationData} visible={isEscalated} />

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full space-y-6">
                <div className="flex flex-col items-center space-y-4 opacity-80">
                  <div className="w-12 h-12 rounded-full gradient-primary shadow-[0_0_40px_rgba(109,91,255,0.35)]" />
                  <p className="text-xl font-semibold tracking-tight theme-text-primary">How can I help you today?</p>
                </div>
                
                {/* Default quick reply chips */}
                <div className="flex flex-wrap justify-center gap-3 mt-4 max-w-lg">
                  {['Track my order', 'Refund policy', 'Talk to a human', 'Product info'].map((reply, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(reply)}
                      className="px-4 py-2 text-sm font-medium chip-gradient-border cursor-pointer"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isStreaming={isStreaming && msg.id === useChatStore.getState().streamingMessageId}
              />
            ))}

            {isTyping && !isStreaming && <TypingIndicator />}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies */}
          {quickReplies.length > 0 && !isStreaming && !isTyping && (
            <div className="px-4 pb-2">
              <QuickReplies replies={quickReplies} onSelect={handleSend} />
            </div>
          )}

          {/* Input */}
          <InputBar onSend={handleSend} disabled={isStreaming || isTyping} />
        </div>

        {/* Smart Panel */}
        {smartPanelOpen && (
          <div className="hidden lg:block w-80 shrink-0">
            <SmartPanel />
          </div>
        )}
      </div>
    </div>
  );
}
