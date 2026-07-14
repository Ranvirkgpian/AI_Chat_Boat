import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', strong = false, ...props }) {
  return (
    <motion.div
      className={`${strong ? 'glass-strong' : 'glass'} rounded-2xl ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
