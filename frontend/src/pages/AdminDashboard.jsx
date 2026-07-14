import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, BookOpen, MessageSquare, Ticket, LogOut } from 'lucide-react';
import { useAuthStore } from '../lib/store';
import { getSocket } from '../lib/socket';
import Logo from '../components/ui/Logo';
import ThemeToggle from '../components/ui/ThemeToggle';
import AnalyticsDashboard from '../components/admin/AnalyticsDashboard';
import KBManager from '../components/admin/KBManager';
import LiveConversations from '../components/admin/LiveConversations';
import TicketQueue from '../components/admin/TicketQueue';

const TABS = [
  { key: 'analytics', label: 'Dashboard', icon: BarChart3 },
  { key: 'kb', label: 'Knowledge Base', icon: BookOpen },
  { key: 'conversations', label: 'Conversations', icon: MessageSquare },
  { key: 'tickets', label: 'Tickets', icon: Ticket },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('analytics');
  const [notifications, setNotifications] = useState({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin');
      return;
    }
    // Join admin room for real-time updates
    const socket = getSocket();
    socket.emit('admin:join');

    // Listen for real-time admin events
    socket.on('admin:escalation', () => {
      setNotifications(prev => ({
        ...prev,
        tickets: (prev.tickets || 0) + 1,
        conversations: (prev.conversations || 0) + 1,
      }));
    });

    socket.on('admin:newMessage', () => {
      setNotifications(prev => ({
        ...prev,
        conversations: (prev.conversations || 0) + 1,
      }));
    });

    return () => {
      socket.off('admin:escalation');
      socket.off('admin:newMessage');
    };
  }, [isAuthenticated, navigate]);

  function handleTabClick(tabKey) {
    setActiveTab(tabKey);
    // Clear notification for this tab
    setNotifications(prev => ({ ...prev, [tabKey]: 0 }));
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex theme-bg">
      {/* Sidebar */}
      <aside className="w-64 theme-panel border-r theme-border flex flex-col shrink-0">
        <div className="p-5 border-b theme-border">
          <Logo size="sm" />
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {TABS.map((tab) => (
            <motion.button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors cursor-pointer ${
                activeTab === tab.key
                  ? 'gradient-primary text-white font-medium'
                  : 'theme-text-secondary theme-hover'
              }`}
              whileHover={{ x: 2 }}
            >
              <tab.icon size={18} />
              {tab.label}
              {notifications[tab.key] > 0 && (
                <span className="ml-auto w-5 h-5 rounded-full gradient-alert flex items-center justify-center text-[10px] text-white font-bold">
                  {notifications[tab.key]}
                </span>
              )}
            </motion.button>
          ))}
        </nav>

        {/* User info */}
        <div className="p-4 border-t theme-border space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate theme-text-primary">{user?.name || 'Admin'}</p>
              <p className="text-xs theme-text-muted truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm theme-text-secondary theme-hover cursor-pointer transition-colors"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold theme-text-primary">
            {TABS.find(t => t.key === activeTab)?.label}
          </h1>
          <ThemeToggle />
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'analytics' && <AnalyticsDashboard />}
          {activeTab === 'kb' && <KBManager />}
          {activeTab === 'conversations' && <LiveConversations />}
          {activeTab === 'tickets' && <TicketQueue />}
        </motion.div>
      </main>
    </div>
  );
}
