import { useState, useEffect } from 'react';
import { ticketAPI } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { motion } from 'framer-motion';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';

const COLUMNS = [
  { key: 'new', label: 'New', icon: AlertCircle, color: '#FF6B6B' },
  { key: 'in_progress', label: 'In Progress', icon: Clock, color: '#FFA26B' },
  { key: 'resolved', label: 'Resolved', icon: CheckCircle, color: '#4ADE80' },
];

const PRIORITY_COLORS = { urgent: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-yellow-500', low: 'bg-blue-500' };

export default function TicketQueue() {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    loadTickets();
    // Auto-refresh every 15 seconds
    const interval = setInterval(loadTickets, 15000);

    // Real-time escalation updates
    const socket = getSocket();
    socket.on('admin:escalation', () => {
      loadTickets();
    });

    return () => {
      clearInterval(interval);
      socket.off('admin:escalation');
    };
  }, []);

  async function loadTickets() {
    try {
      const { data } = await ticketAPI.list();
      setTickets(data.tickets || []);
    } catch (err) { console.error('Error loading tickets:', err); }
  }

  async function moveTicket(ticketId, newStatus) {
    try {
      await ticketAPI.update(ticketId, { status: newStatus });
      loadTickets();
    } catch (err) { console.error('Error updating ticket:', err); }
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        {COLUMNS.map((col) => {
          const colTickets = tickets.filter(t => t.status === col.key);
          return (
            <div key={col.key} className="space-y-3">
              {/* Column header */}
              <div className="flex items-center gap-2 px-1">
                <col.icon size={16} style={{ color: col.color }} />
                <span className="font-semibold text-sm theme-text-primary">{col.label}</span>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full theme-tag theme-text-secondary">{colTickets.length}</span>
              </div>

              {/* Tickets */}
              <div className="space-y-2 min-h-[200px] theme-card rounded-xl p-3">
                {colTickets.length === 0 ? (
                  <p className="text-xs text-center theme-text-muted py-8">No tickets</p>
                ) : (
                  colTickets.map((ticket) => (
                    <motion.div
                      key={ticket.id}
                      className="theme-card rounded-xl p-3 space-y-2 border theme-border"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      layout
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-mono theme-text-muted">#{ticket.id}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] theme-text-secondary capitalize">{ticket.priority}</span>
                          <span className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[ticket.priority] || 'bg-gray-400'}`} title={ticket.priority} />
                        </div>
                      </div>

                      {/* Summary */}
                      <p className="text-sm theme-text-primary line-clamp-3">{ticket.summary || 'No summary'}</p>

                      <div className="flex items-center justify-between text-xs">
                        <span className="theme-text-muted">{ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : ''}</span>
                        <div className="flex gap-1">
                          {col.key !== 'in_progress' && col.key !== 'resolved' && (
                            <button onClick={() => moveTicket(ticket.id, 'in_progress')} className="px-2 py-0.5 rounded-lg theme-hover cursor-pointer text-xs theme-text-secondary">→ Start</button>
                          )}
                          {col.key !== 'resolved' && (
                            <button onClick={() => moveTicket(ticket.id, 'resolved')} className="px-2 py-0.5 rounded-lg hover:bg-green-500/20 text-green-400 cursor-pointer text-xs">✓ Resolve</button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
