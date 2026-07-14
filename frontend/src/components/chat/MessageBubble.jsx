import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AnimatedAvatar from '../ui/AnimatedAvatar';
import SourceAttribution from './SourceAttribution';

export default function MessageBubble({ message, isStreaming = false }) {
  const isUser = message.role === 'user';
  const isAgent = message.role === 'agent';
  const isBot = message.role === 'bot';

  const time = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <motion.div
      className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="mt-1">
          <AnimatedAvatar size={32} isThinking={isStreaming} isAgent={isAgent} />
        </div>
      )}

      {/* Message content */}
      <div className="flex flex-col gap-1">
        {/* Sender label */}
        {!isUser && (
          <span className="text-xs opacity-60 ml-1">
            {isAgent ? (message.agentName || 'Support Agent') : 'FlowBot'}
          </span>
        )}

        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'gradient-user-msg text-white rounded-br-md'
              : 'glass rounded-bl-md'
          }`}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed">{message.content}</p>
          ) : (
            <div className="bot-markdown text-sm leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content || ''}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Sources */}
        {isBot && message.sources && message.sources.length > 0 && !isStreaming && (
          <SourceAttribution sources={message.sources} />
        )}

        {/* Timestamp */}
        {time && (
          <span className={`text-[10px] opacity-40 ${isUser ? 'text-right mr-1' : 'ml-1'}`}>
            {time}
          </span>
        )}
      </div>
    </motion.div>
  );
}
