import { motion, AnimatePresence } from 'framer-motion';
import { HeadphonesIcon, Clock, AlertCircle } from 'lucide-react';

export default function EscalationBanner({ data, visible = false }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="mx-4 mt-2 rounded-xl px-5 py-4 gradient-alert text-white"
        >
          <div className="flex items-center gap-3">
            <HeadphonesIcon size={24} className="shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-sm">Connecting you with a support specialist</p>
              <p className="text-xs opacity-90 mt-0.5">
                They'll have the full context of our conversation — no need to repeat anything.
              </p>
            </div>
            {data?.estimatedWait && (
              <div className="flex items-center gap-1 text-xs opacity-90 shrink-0">
                <Clock size={14} />
                <span>{data.estimatedWait}</span>
              </div>
            )}
          </div>

          {/* Conversation summary for agent handoff */}
          {data?.summary && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="mt-3 pt-3 border-t border-white/20"
            >
              <p className="text-xs font-medium opacity-80 mb-1 flex items-center gap-1">
                <AlertCircle size={12} />
                Conversation Summary
              </p>
              <p className="text-xs opacity-90 leading-relaxed">{data.summary}</p>
            </motion.div>
          )}

          {/* Escalation reason */}
          {data?.reason && (
            <p className="text-[10px] opacity-60 mt-2">
              Reason: {data.reason}
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
