// Knowledge Base Routes — CRUD for KB articles with RAG ingestion
import { Router } from 'express';
import db from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';
import { ingestArticle, removeArticle } from '../services/rag.js';

const router = Router();

// GET /api/kb — List all articles (public for search, admin sees all details)
router.get('/', (req, res) => {
  const { category, search } = req.query;
  let query = 'SELECT * FROM kb_articles';
  const params = [];

  if (category) {
    query += ' WHERE category = ?';
    params.push(category);
  }

  if (search) {
    query += params.length ? ' AND' : ' WHERE';
    query += ' (title LIKE ? OR content LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY updated_at DESC';
  const articles = db.prepare(query).all(...params);

  res.json({ articles });
});

// GET /api/kb/categories — List unique categories
router.get('/categories', (req, res) => {
  const categories = db.prepare('SELECT DISTINCT category FROM kb_articles ORDER BY category').all();
  res.json({ categories: categories.map(c => c.category) });
});

// GET /api/kb/:id — Get a single article
router.get('/:id', (req, res) => {
  const article = db.prepare('SELECT * FROM kb_articles WHERE id = ?').get(req.params.id);
  if (!article) return res.status(404).json({ error: 'Article not found' });
  res.json({ article });
});

// POST /api/kb — Create a new article (admin only)
router.post('/', requireAuth, async (req, res) => {
  const { title, content, category, tags } = req.body;
  if (!title || !content || !category) {
    return res.status(400).json({ error: 'Title, content, and category are required' });
  }

  const result = db.prepare(
    'INSERT INTO kb_articles (title, content, category, tags) VALUES (?, ?, ?, ?)'
  ).run(title, content, category, JSON.stringify(tags || []));

  const article = db.prepare('SELECT * FROM kb_articles WHERE id = ?').get(result.lastInsertRowid);

  // Ingest into vector store for RAG
  try {
    await ingestArticle(article.id, article.title, article.content);
  } catch (err) {
    console.error('[KB] Error ingesting article:', err.message);
  }

  res.status(201).json({ article });
});

// PUT /api/kb/:id — Update an article (admin only)
router.put('/:id', requireAuth, async (req, res) => {
  const { title, content, category, tags } = req.body;
  const existing = db.prepare('SELECT * FROM kb_articles WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Article not found' });

  db.prepare(
    'UPDATE kb_articles SET title = ?, content = ?, category = ?, tags = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(
    title || existing.title,
    content || existing.content,
    category || existing.category,
    JSON.stringify(tags || JSON.parse(existing.tags || '[]')),
    req.params.id
  );

  const article = db.prepare('SELECT * FROM kb_articles WHERE id = ?').get(req.params.id);

  // Re-ingest into vector store
  try {
    await ingestArticle(article.id, article.title, article.content);
  } catch (err) {
    console.error('[KB] Error re-ingesting article:', err.message);
  }

  res.json({ article });
});

// DELETE /api/kb/:id — Delete an article (admin only)
router.delete('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM kb_articles WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Article not found' });

  db.prepare('DELETE FROM kb_articles WHERE id = ?').run(req.params.id);
  removeArticle(parseInt(req.params.id));

  res.json({ message: 'Article deleted' });
});

export default router;
