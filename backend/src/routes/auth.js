// Auth Routes — Login and registration for admin users
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/connection.js';
import { generateToken, requireAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateToken(user);
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)').run(email, hash, name, 'admin');

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  const token = generateToken(user);

  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

export default router;
