// Ticket Routes — Escalation ticket queue management
import { Router } from 'express';
import db from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/tickets — List tickets with optional filters
router.get('/', requireAuth, (req, res) => {
  const { status, priority } = req.query;
  let query = `
    SELECT t.*, c.session_id, 
      (SELECT COUNT(*) FROM messages WHERE conversation_id = t.conversation_id) as message_count
    FROM tickets t
    LEFT JOIN conversations c ON t.conversation_id = c.id
  `;
  const conditions = [];
  const params = [];

  if (status) { conditions.push('t.status = ?'); params.push(status); }
  if (priority) { conditions.push('t.priority = ?'); params.push(priority); }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');

  query += ' ORDER BY t.created_at DESC';
  const tickets = db.prepare(query).all(...params);

  res.json({ tickets });
});

// GET /api/tickets/stats — Ticket statistics
router.get('/stats', requireAuth, (req, res) => {
  const stats = {
    total: db.prepare('SELECT COUNT(*) as count FROM tickets').get().count,
    new: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'new'").get().count,
    in_progress: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'in_progress'").get().count,
    resolved: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'resolved'").get().count,
  };
  res.json({ stats });
});

// PUT /api/tickets/:id — Update ticket status/assignment
router.put('/:id', requireAuth, (req, res) => {
  const { status, priority, assigned_to } = req.body;
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  db.prepare(
    'UPDATE tickets SET status = ?, priority = ?, assigned_to = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(
    status || ticket.status,
    priority || ticket.priority,
    assigned_to ?? ticket.assigned_to,
    req.params.id
  );

  // If resolved, also resolve the conversation
  if (status === 'resolved') {
    db.prepare("UPDATE conversations SET status = 'resolved', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(ticket.conversation_id);
  }

  const updated = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  res.json({ ticket: updated });
});

export default router;
