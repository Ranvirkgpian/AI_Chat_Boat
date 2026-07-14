import { useState, useEffect } from 'react';
import { conversationAPI } from '../../lib/api';
import { useAuthStore } from '../../lib/store';
import { getSocket } from '../../lib/socket';
import { MessageSquare, Eye, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LiveConversations() {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const { user } = useAuthStore();

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 10000);

    // Real-time updates
    const socket = getSocket();
    socket.on('admin:newMessage', () => {
      loadConversations();
    });
    socket.on('admin:escalation', () => {
      loadConversations();
    });

    return () => {
      clearInterval(interval);
      socket.off('admin:newMessage');
      socket.off('admin:escalation');
    };
  }, []);

  async function loadConversations() {
    try {
      const { data } = await conversationAPI.list();
      setConversations(data.conversations || []);
    } catch (err) { console.error('Error loading conversations:', err); }
  }

  async function viewConversation(conv) {
    setSelected(conv);
    try {
      const { data } = await conversationAPI.get(conv.id);
      setMessages(data.messages || []);
    } catch (err) { console.error('Error loading messages:', err); }
  }

  function handleTakeover(conv) {
    const socket = getSocket();
    socket.emit('admin:takeover', {
      conversationId: conv.id,
      agentName: user?.name || 'Support Agent',
    });
  }

  const statusColors = { active: 'bg-green-400', escalated: 'bg-orange-400', resolved: 'bg-gray-400' };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Conversation list */}
        <div className="space-y-3">
          {conversations.length === 0 ? (
            <div className="theme-card rounded-xl p-8 text-center theme-text-muted">
              <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <motion.div
                key={conv.id}
                className={`theme-card rounded-xl p-4 cursor-pointer transition-colors ${selected?.id === conv.id ? 'ring-1 ring-[#6D5BFF]' : 'theme-hover'}`}
                onClick={() => viewConversation(conv)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${statusColors[conv.status] || 'bg-gray-400'}`} />
                    <span className="text-sm font-medium truncate theme-text-primary">{conv.title || conv.first_message || 'No messages'}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {conv.status === 'escalated' && (
                      <motion.button
                        onClick={(e) => { e.stopPropagation(); handleTakeover(conv); }}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium gradient-primary text-white cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <UserCheck size={12} />
                        Take Over
                      </motion.button>
                    )}
                    <span className="text-xs theme-text-muted">{conv.message_count || 0} msgs</span>
                    <Eye size={14} className="theme-text-muted" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs theme-text-muted">
                  <span className={`capitalize ${conv.status === 'escalated' ? 'text-orange-400 font-medium' : ''}`}>{conv.status}</span>
                  <span>•</span>
                  <span>{conv.updated_at ? new Date(conv.updated_at).toLocaleString() : ''}</span>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Message view */}
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.id}
              className="theme-card rounded-xl p-4 space-y-3 max-h-[600px] overflow-y-auto"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center justify-between border-b theme-border pb-3">
                <h3 className="font-semibold text-sm theme-text-primary">Conversation Detail</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[selected.status]} text-white`}>
                  {selected.status}
                </span>
              </div>
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                    msg.role === 'user' ? 'gradient-user-msg text-white' : 'theme-card'
                  }`}>
                    <p className="text-[10px] theme-text-muted mb-1 font-medium">
                      {msg.role === 'user' ? 'Customer' : msg.role === 'agent' ? 'Agent' : 'FlowBot'}
                      {msg.intent && <span className="ml-2 theme-text-muted">[{msg.intent}]</span>}
                    </p>
                    <span className="theme-text-primary">{msg.content}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <div className="theme-card rounded-xl p-8 text-center theme-text-muted flex flex-col items-center justify-center min-h-[300px]">
              <Eye size={32} className="mb-2 opacity-50" />
              <p className="text-sm">Select a conversation to view</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
