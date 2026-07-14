// Escalation Engine — Rule + sentiment scoring for intelligent handoff
import { generate } from './llm.js';
import db from '../db/connection.js';

const ESCALATION_KEYWORDS = [
  'talk to human', 'talk to a human', 'speak to someone', 'real person',
  'talk to agent', 'talk to a person', 'human agent', 'speak to agent',
  'manager', 'supervisor', 'escalate', 'complaint', 'sue', 'lawyer', 'legal',
];

const SENSITIVE_TOPICS = ['billing', 'returns_refunds'];

/**
 * Evaluate whether a conversation should be escalated
 * @param {object} params
 * @param {string} params.message - Latest user message
 * @param {string} params.intent - Classified intent
 * @param {object} params.sentiment - Sentiment analysis result
 * @param {Array} params.recentMessages - Last N messages with sentiments
 * @param {string} params.conversationId
 * @returns {{shouldEscalate: boolean, reason: string, priority: string}}
 */
export function evaluateEscalation({ message, intent, sentiment, recentMessages = [], conversationId }) {
  const reasons = [];
  let priorityScore = 0;

  // Rule 1: Explicit escalation request
  const lowerMessage = message.toLowerCase();
  if (ESCALATION_KEYWORDS.some(kw => lowerMessage.includes(kw)) || intent === 'escalation') {
    reasons.push('Customer explicitly requested human agent');
    priorityScore += 3;
  }

  // Rule 2: Sustained negative sentiment (2+ consecutive negative messages)
  const recentSentiments = recentMessages.slice(-3).map(m => m.sentiment_score).filter(s => s !== null);
  const negativeStreak = recentSentiments.filter(s => s < -0.3).length;
  if (negativeStreak >= 2) {
    reasons.push(`Sustained negative sentiment (${negativeStreak} consecutive negative messages)`);
    priorityScore += 2;
  }

  // Rule 3: High frustration in current message
  if (sentiment.frustration >= 4) {
    reasons.push(`High frustration level detected (${sentiment.frustration}/5)`);
    priorityScore += 2;
  }

  // Rule 4: Sensitive topic with negative sentiment
  if (SENSITIVE_TOPICS.includes(intent) && sentiment.score < -0.2) {
    reasons.push(`Sensitive topic (${intent}) with negative sentiment`);
    priorityScore += 1;
  }

  // Rule 5: Repeated uncertain bot responses
  const recentBotMessages = recentMessages.filter(m => m.role === 'bot').slice(-3);
  const uncertainResponses = recentBotMessages.filter(m =>
    m.content && (m.content.includes("I'm not sure") || m.content.includes("I don't have") || m.confidence < 0.3)
  ).length;
  if (uncertainResponses >= 2) {
    reasons.push('Multiple uncertain responses — bot unable to resolve');
    priorityScore += 2;
  }

  const shouldEscalate = priorityScore >= 2;
  const priority = priorityScore >= 4 ? 'urgent' : priorityScore >= 3 ? 'high' : priorityScore >= 2 ? 'medium' : 'low';

  return {
    shouldEscalate,
    reason: reasons.join('; ') || 'No escalation needed',
    priority,
  };
}

/**
 * Create an escalation ticket with auto-generated conversation summary
 * @param {string} conversationId 
 * @param {string} reason 
 * @param {string} priority 
 * @returns {Promise<object>} - Created ticket
 */
export async function createEscalationTicket(conversationId, reason, priority) {
  // Get conversation messages for summary
  const messages = db.prepare(
    'SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at'
  ).all(conversationId);

  // Generate summary via LLM
  let summary = reason;
  try {
    const conversationText = messages.map(m =>
      `${m.role === 'user' ? 'Customer' : 'FlowBot'}: ${m.content}`
    ).join('\n');

    summary = await generate(
      `Summarize this customer support conversation in 2-3 sentences for a human agent taking over. Focus on: what the customer needs, what was already tried, and the current issue.\n\nConversation:\n${conversationText}`,
      { useLite: true, temperature: 0.2, maxTokens: 200 }
    );
  } catch (err) {
    console.warn('[Escalation] Summary generation fallback:', err.message);
    const lastThreeMessages = messages.slice(-3).map(m => `${m.role === 'user' ? 'Customer' : 'Bot'}: ${m.content}`).join(' | ');
    summary = `Customer escalation. Reason: ${reason}. Recent interaction: ${lastThreeMessages}. Total messages: ${messages.length}.`;
  }

  // Update conversation status
  db.prepare('UPDATE conversations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run('escalated', conversationId);

  // Create ticket
  const result = db.prepare(
    'INSERT INTO tickets (conversation_id, status, priority, summary) VALUES (?, ?, ?, ?)'
  ).run(conversationId, 'new', priority, summary);

  // Log analytics event
  db.prepare(
    'INSERT INTO analytics_events (event_type, conversation_id, metadata) VALUES (?, ?, ?)'
  ).run('escalation', conversationId, JSON.stringify({ reason, priority }));

  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(result.lastInsertRowid);
  console.log(`[Escalation] Created ticket #${ticket.id} for conversation ${conversationId}`);
  return ticket;
}
