import { motion } from 'framer-motion';

export default function QuickReplies({ replies = [], onSelect }) {
  if (!replies || replies.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 px-1 scrollbar-hide">
      {replies.map((reply, i) => (
        <motion.button
          key={i}
          onClick={() => onSelect(reply.value || reply.text)}
          className="shrink-0 px-4 py-2 text-sm rounded-full glass gradient-border cursor-pointer hover:bg-white/10 transition-colors whitespace-nowrap"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: i * 0.05 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {reply.text}
        </motion.button>
      ))}
    </div>
  );
}
