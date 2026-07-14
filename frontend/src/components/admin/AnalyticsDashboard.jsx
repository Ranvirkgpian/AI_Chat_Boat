import { useState, useEffect } from 'react';
import { analyticsAPI } from '../../lib/api';
import { useThemeStore } from '../../lib/store';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MessageSquare, CheckCircle, HeadphonesIcon, Clock, TrendingUp, Shield } from 'lucide-react';

const COLORS = ['#6D5BFF', '#3EC6E0', '#8B5CF6', '#FF6B6B', '#FFA26B', '#4ADE80'];

function AnimatedCounter({ value, duration = 1000 }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseInt(value) || 0;
    if (start === end) return;
    const timer = setInterval(() => {
      start += Math.ceil(end / (duration / 30));
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(start);
    }, 30);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <span>{count}</span>;
}

export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [intents, setIntents] = useState([]);
  const [sentiment, setSentiment] = useState([]);
  const [convOverTime, setConvOverTime] = useState([]);
  const theme = useThemeStore((s) => s.theme);

  async function load() {
    try {
      const [m, i, s, c] = await Promise.all([
        analyticsAPI.overview(),
        analyticsAPI.intents(),
        analyticsAPI.sentiment(),
        analyticsAPI.conversationsOverTime(),
      ]);
      setMetrics(m.data.metrics);
      setIntents(i.data.intents || []);
      setSentiment(s.data.trends || []);
      setConvOverTime(c.data.data || []);
    } catch (err) { console.error('Error loading analytics:', err); }
  }

  useEffect(() => {
    load();
    // Auto-refresh every 30 seconds
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  // Theme-aware tooltip style
  const tooltipStyle = {
    background: theme === 'light' ? '#FFFFFF' : '#1A1B2E',
    border: `1px solid ${theme === 'light' ? '#E5E7EB' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 12,
    fontSize: 12,
    color: theme === 'light' ? '#1F2937' : '#E5E7EB',
  };

  const tickFill = theme === 'light' ? '#6B7280' : '#999';

  const metricCards = metrics ? [
    { label: 'Total Conversations', value: metrics.totalConversations, icon: MessageSquare, color: '#6D5BFF' },
    { label: 'Resolution Rate', value: `${metrics.resolutionRate}%`, icon: CheckCircle, color: '#4ADE80' },
    { label: 'Deflection Rate', value: `${metrics.deflectionRate}%`, icon: Shield, color: '#3EC6E0' },
    { label: 'Avg Response Time', value: `${metrics.avgResponseTime}ms`, icon: Clock, color: '#FFA26B' },
    { label: 'Active Now', value: metrics.activeConversations, icon: TrendingUp, color: '#8B5CF6' },
    { label: 'Escalated', value: metrics.escalatedConversations, icon: HeadphonesIcon, color: '#FF6B6B' },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {metricCards.map((card, i) => (
          <motion.div
            key={card.label}
            className="theme-card rounded-xl p-4 space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="flex items-center gap-2">
              <card.icon size={16} style={{ color: card.color }} />
              <span className="text-xs theme-text-muted">{card.label}</span>
            </div>
            <p className="text-2xl font-bold theme-text-primary">
              {typeof card.value === 'number' ? <AnimatedCounter value={card.value} /> : card.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Conversations over time */}
        <div className="theme-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4 theme-text-primary">Conversations Over Time</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={convOverTime}>
              <defs>
                <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6D5BFF" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6D5BFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="count" stroke="#6D5BFF" fill="url(#colorConv)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Intent distribution */}
        <div className="theme-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4 theme-text-primary">Intent Distribution</h3>
          {intents.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={intents} dataKey="count" nameKey="intent" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3}>
                  {intents.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center theme-text-muted text-sm">No data yet</div>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {intents.map((intent, i) => (
              <span key={intent.intent} className="flex items-center gap-1 text-xs theme-text-secondary">
                <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                {intent.intent} ({intent.count})
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Sentiment trends */}
      <div className="theme-card rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4 theme-text-primary">Sentiment Trends</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={sentiment}>
            <defs>
              <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3EC6E0" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3EC6E0" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} />
            <YAxis domain={[-1, 1]} tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="avg_sentiment" stroke="#3EC6E0" fill="url(#colorSent)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
