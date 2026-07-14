// Analytics Routes — Aggregated metrics for admin dashboard
import { Router } from 'express';
import db from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/analytics — Dashboard overview metrics
router.get('/', requireAuth, (req, res) => {
  const totalConversations = db.prepare('SELECT COUNT(*) as count FROM conversations').get().count;
  const resolvedConversations = db.prepare("SELECT COUNT(*) as count FROM conversations WHERE status = 'resolved'").get().count;
  const escalatedConversations = db.prepare("SELECT COUNT(*) as count FROM conversations WHERE status = 'escalated'").get().count;
  const activeConversations = db.prepare("SELECT COUNT(*) as count FROM conversations WHERE status = 'active'").get().count;
  const totalMessages = db.prepare('SELECT COUNT(*) as count FROM messages').get().count;
  const avgMessagesPerConversation = totalConversations > 0 ? Math.round(totalMessages / totalConversations * 10) / 10 : 0;

  // Resolution rate
  const resolutionRate = totalConversations > 0
    ? Math.round(resolvedConversations / totalConversations * 100)
    : 0;

  // Deflection rate (resolved without human = not escalated)
  const deflectionRate = totalConversations > 0
    ? Math.round((totalConversations - escalatedConversations) / totalConversations * 100)
    : 0;

  // Average response latency
  const avgLatency = db.prepare("SELECT AVG(latency_ms) as avg FROM messages WHERE role = 'bot' AND latency_ms > 0").get().avg || 0;

  res.json({
    metrics: {
      totalConversations,
      activeConversations,
      resolvedConversations,
      escalatedConversations,
      totalMessages,
      avgMessagesPerConversation,
      resolutionRate,
      deflectionRate,
      avgResponseTime: Math.round(avgLatency),
    },
  });
});

// GET /api/analytics/intents — Intent distribution
router.get('/intents', requireAuth, (req, res) => {
  const intents = db.prepare(`
    SELECT intent, COUNT(*) as count
    FROM messages
    WHERE intent IS NOT NULL AND role = 'user'
    GROUP BY intent
    ORDER BY count DESC
  `).all();

  res.json({ intents });
});

// GET /api/analytics/sentiment — Sentiment trends (daily averages)
router.get('/sentiment', requireAuth, (req, res) => {
  const trends = db.prepare(`
    SELECT
      DATE(created_at) as date,
      ROUND(AVG(sentiment_score), 2) as avg_sentiment,
      COUNT(*) as message_count
    FROM messages
    WHERE sentiment_score IS NOT NULL AND role = 'user'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
    LIMIT 30
  `).all().reverse();

  res.json({ trends });
});

// GET /api/analytics/conversations-over-time — Conversations per day
router.get('/conversations-over-time', requireAuth, (req, res) => {
  const data = db.prepare(`
    SELECT
      DATE(created_at) as date,
      COUNT(*) as count
    FROM conversations
    GROUP BY DATE(created_at)
    ORDER BY date DESC
    LIMIT 30
  `).all().reverse();

  res.json({ data });
});

export default router;
