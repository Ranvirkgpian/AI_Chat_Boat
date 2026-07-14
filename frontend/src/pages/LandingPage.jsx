import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Shield } from 'lucide-react';
import Logo from '../components/ui/Logo';
import GradientButton from '../components/ui/GradientButton';
import ThemeToggle from '../components/ui/ThemeToggle';
import { APP_TAGLINE } from '../data/constants';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen animated-gradient-bg flex items-center justify-center overflow-hidden">
      {/* Floating orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="orb-1 absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #6D5BFF 0%, transparent 70%)' }} />
        <div className="orb-2 absolute top-1/3 right-1/4 w-80 h-80 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #3EC6E0 0%, transparent 70%)' }} />
        <div className="orb-3 absolute bottom-1/4 left-1/3 w-72 h-72 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)' }} />
      </div>

      {/* Theme toggle */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      {/* Main content */}
      <motion.div
        className="relative z-10 glass-strong rounded-3xl p-10 max-w-md w-full mx-4 text-center space-y-8"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>

        <p className="text-lg opacity-70 leading-relaxed">
          {APP_TAGLINE}
        </p>

        <div className="space-y-3">
          <GradientButton
            size="lg"
            className="w-full pulse-glow flex items-center justify-center gap-2"
            onClick={() => navigate('/chat')}
          >
            Start Chat <ArrowRight size={20} />
          </GradientButton>

          <button
            onClick={() => navigate('/admin')}
            className="flex items-center justify-center gap-2 w-full text-sm opacity-50 hover:opacity-100 transition-opacity py-2 cursor-pointer"
          >
            <Shield size={14} />
            Admin Dashboard
          </button>
        </div>

        {/* Stats badges */}
        <div className="flex justify-center gap-6 pt-2">
          {[
            { label: '24/7', sub: 'Available' },
            { label: '< 2s', sub: 'Response' },
            { label: '85%', sub: 'Resolved' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-bold gradient-primary-text text-lg">{stat.label}</p>
              <p className="text-[10px] opacity-40">{stat.sub}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Bottom brand */}
      <div className="absolute bottom-6 text-xs opacity-20 text-center">
        Powered by FlowSupport AI • Built for FlowZint AI Hackathon
      </div>
    </div>
  );
}
