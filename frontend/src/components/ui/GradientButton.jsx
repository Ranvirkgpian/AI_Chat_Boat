import { motion } from 'framer-motion';

export default function GradientButton({ children, className = '', variant = 'primary', size = 'md', ...props }) {
  const variants = {
    primary: 'gradient-primary text-white',
    alert: 'gradient-alert text-white',
    ghost: 'bg-transparent border border-white/20 text-white hover:bg-white/10',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <motion.button
      className={`${variants[variant]} ${sizes[size]} rounded-xl font-semibold cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(109, 91, 255, 0.4)' }}
      whileTap={{ scale: 0.97 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
