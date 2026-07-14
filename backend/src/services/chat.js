// Chat Service — Session management and context handling
import db from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get or create a conversation for a session
 */
export function getOrCreateConversation(sessionId, conversationId) {
  if (conversationId) {
    const existing = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId);
    if (existing) return existing;
  }

  const id = conversationId || uuidv4();
  db.prepare('INSERT INTO conversations (id, session_id) VALUES (?, ?)').run(id, sessionId);
  
  // Log analytics
  db.prepare('INSERT INTO analytics_events (event_type, conversation_id) VALUES (?, ?)').run('conversation_start', id);

  return db.prepare('SELECT * FROM conversations WHERE id = ?').get(id);
}

/**
 * Save a message to the database
 */
export function saveMessage(conversationId, role, content, metadata = {}) {
  const result = db.prepare(`
    INSERT INTO messages (conversation_id, role, content, intent, sentiment_score, confidence, sources, tokens_used, latency_ms)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    conversationId,
    role,
    content,
    metadata.intent || null,
    metadata.sentimentScore ?? null,
    metadata.confidence ?? null,
    metadata.sources ? JSON.stringify(metadata.sources) : null,
    metadata.tokensUsed || 0,
    metadata.latencyMs || 0,
  );

  // Update conversation timestamp
  db.prepare('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(conversationId);

  return result.lastInsertRowid;
}

/**
 * Get conversation history for context
 */
export function getConversationHistory(conversationId, limit = 20) {
  return db.prepare(
    'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT ?'
  ).all(conversationId, limit).reverse();
}

/**
 * Get all conversations for a session
 */
export function getSessionConversations(sessionId) {
  return db.prepare(
    'SELECT * FROM conversations WHERE session_id = ? ORDER BY updated_at DESC'
  ).all(sessionId);
}

/**
 * Generate dynamic quick reply suggestions based on context
 */
export function generateQuickReplies(intent, conversationLength) {
  const defaultReplies = [
    { text: '📦 Track my order', value: 'Where is my order?' },
    { text: '↩️ Return policy', value: 'What is your return policy?' },
    { text: '👤 Talk to a human', value: 'I want to talk to a human agent' },
  ];

  const contextualReplies = {
    order_status: [
      { text: '📦 Track another order', value: 'I want to track another order' },
      { text: '📅 Estimated delivery', value: 'When will my order arrive?' },
      { text: '❌ Cancel my order', value: 'I want to cancel my order' },
    ],
    billing: [
      { text: '💳 Payment methods', value: 'What payment methods do you accept?' },
      { text: '🧾 View invoice', value: 'Can I see my invoice?' },
      { text: '💰 Refund status', value: 'What is the status of my refund?' },
    ],
    returns_refunds: [
      { text: '📋 Start a return', value: 'How do I start a return?' },
      { text: '⏱️ Refund timeline', value: 'How long do refunds take?' },
      { text: '🔄 Exchange instead', value: 'Can I exchange instead of return?' },
    ],
    technical: [
      { text: '🔄 Clear cache', value: 'How do I clear my cache?' },
      { text: '🔐 Reset password', value: 'I need to reset my password' },
      { text: '📱 App not working', value: 'The app is not loading properly' },
    ],
    account: [
      { text: '🔐 Reset password', value: 'How do I reset my password?' },
      { text: '📧 Update email', value: 'I want to update my email address' },
      { text: '❌ Delete account', value: 'How do I delete my account?' },
    ],
  };

  if (conversationLength <= 1) return defaultReplies;

  return contextualReplies[intent] || defaultReplies;
}
