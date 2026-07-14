// Conversations Routes — History retrieval for admin dashboard
import { Router } from 'express';
import db from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/conversations — List all conversations (admin)
router.get('/', requireAuth, (req, res) => {
  const { status } = req.query;
  let query = `
    SELECT c.*,
      (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count,
      (SELECT content FROM messages WHERE conversation_id = c.id AND role = 'user' ORDER BY created_at LIMIT 1) as first_message
    FROM conversations c
  `;
  const params = [];

  if (status) {
    query += ' WHERE c.status = ?';
    params.push(status);
  }

  query += ' ORDER BY c.updated_at DESC LIMIT 100';
  const conversations = db.prepare(query).all(...params);

  res.json({ conversations });
});

// GET /api/conversations/:id — Get conversation with all messages
router.get('/:id', requireAuth, (req, res) => {
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);
  if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

  const messages = db.prepare(
    'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at'
  ).all(req.params.id);

  res.json({ conversation, messages });
});

export default router;
