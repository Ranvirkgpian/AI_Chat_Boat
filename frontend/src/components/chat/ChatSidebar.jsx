import { useEffect } from 'react';
import { MessageSquare, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useChatStore } from '../../lib/store';

export default function ChatSidebar({ isOpen, onClose }) {
  const { conversations, conversationId, newConversation, setConversations, setConversationId } = useChatStore();

  // Conversations are populated via the chat:conversationList socket event
  // emitted by the backend after each exchange

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <div
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } fixed lg:relative z-50 lg:z-auto w-72 h-full theme-panel border-r theme-border flex flex-col transition-transform duration-300`}
      >
        {/* Header */}
        <div className="p-4 border-b theme-border">
          <motion.button
            onClick={() => { newConversation(); onClose?.(); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-medium cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus size={16} />
            New Conversation
          </motion.button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {conversations.length === 0 ? (
            <div className="text-center text-sm theme-text-secondary mt-8">
              <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
              <p>No conversations yet</p>
              <p className="text-xs mt-1">Start chatting!</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => {
                  setConversationId(conv.id);
                  onClose?.();
                }}
                className={`w-full text-left p-3 rounded-xl text-sm transition-colors cursor-pointer ${
                  conv.id === conversationId ? 'theme-active' : 'theme-hover'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} className="theme-text-muted shrink-0" />
                  <span className="truncate theme-text-primary">
                    {conv.title || conv.first_message || 'New conversation'}
                  </span>
                </div>
                <span className="text-[10px] theme-text-muted ml-6">
                  {conv.status && (
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${
                      conv.status === 'active' ? 'bg-green-400' : conv.status === 'escalated' ? 'bg-orange-400' : 'bg-gray-400'
                    }`} />
                  )}
                  {conv.updated_at ? new Date(conv.updated_at).toLocaleDateString() : ''}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}
