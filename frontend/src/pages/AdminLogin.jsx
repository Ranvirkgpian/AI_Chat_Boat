import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn } from 'lucide-react';
import { useAuthStore } from '../lib/store';
import { authAPI } from '../lib/api';
import Logo from '../components/ui/Logo';
import GradientButton from '../components/ui/GradientButton';
import ThemeToggle from '../components/ui/ThemeToggle';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('admin@flowsupport.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authAPI.login(email, password);
      login(data.token, data.user);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen animated-gradient-bg flex items-center justify-center">
      <div className="absolute top-6 right-6"><ThemeToggle /></div>

      <motion.form
        onSubmit={handleLogin}
        className="glass-strong rounded-3xl p-8 max-w-sm w-full mx-4 space-y-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center space-y-2">
          <div className="flex justify-center"><Logo size="md" /></div>
          <p className="text-sm opacity-50">Admin Dashboard</p>
        </div>

        {error && (
          <div className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Email" required
            className="w-full px-4 py-3 rounded-xl glass bg-transparent text-sm outline-none focus:ring-2 focus:ring-primary-violet/50"
          />
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Password" required
            className="w-full px-4 py-3 rounded-xl glass bg-transparent text-sm outline-none focus:ring-2 focus:ring-primary-violet/50"
          />
        </div>

        <GradientButton type="submit" className="w-full flex items-center justify-center gap-2" disabled={loading}>
          <LogIn size={18} />
          {loading ? 'Signing in...' : 'Sign In'}
        </GradientButton>

        <button type="button" onClick={() => navigate('/')} className="w-full text-xs opacity-40 hover:opacity-100 py-2 cursor-pointer">
          ← Back to chat
        </button>
      </motion.form>
    </div>
  );
}
