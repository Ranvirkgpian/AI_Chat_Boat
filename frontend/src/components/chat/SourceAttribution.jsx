import { useState } from 'react';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SourceAttribution({ sources }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="ml-1 mt-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-xs opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
      >
        <FileText size={12} />
        <span>{sources.length} source{sources.length > 1 ? 's' : ''}</span>
        {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-1">
              {sources.map((source, i) => (
                <div key={i} className="flex items-center gap-2 text-xs glass rounded-lg px-3 py-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: 'linear-gradient(135deg, #6D5BFF, #3EC6E0)' }}
                  />
                  <span className="opacity-80">{source.title}</span>
                  {source.category && (
                    <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] bg-white/10">
                      {source.category}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
