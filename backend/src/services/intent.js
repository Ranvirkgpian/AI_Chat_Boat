// Intent Classification — Local keyword matching + Gemini Flash Lite fallback
import { generateJSON } from './llm.js';

const INTENT_CATEGORIES = [
  'faq', 'order_status', 'billing', 'technical', 'account',
  'returns_refunds', 'escalation', 'small_talk', 'greeting',
];

/**
 * Fast local keyword-based intent classification
 * Returns null if no confident match (falls through to LLM)
 */
function localClassify(message) {
  const lower = message.toLowerCase().trim();

  // Greeting patterns
  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening)|howdy|sup|yo)\b/i.test(lower)) {
    return { intent: 'greeting', confidence: 0.95 };
  }

  // Escalation patterns
  const escalationKeywords = ['talk to human', 'talk to a human', 'speak to someone', 'real person',
    'talk to agent', 'talk to a person', 'human agent', 'speak to agent',
    'manager', 'supervisor', 'escalate', 'representative'];
  if (escalationKeywords.some(kw => lower.includes(kw))) {
    return { intent: 'escalation', confidence: 0.95 };
  }

  // Order status patterns
  if (/\b(track|tracking|where\s+is\s+my\s+order|order\s+status|shipping\s+status|delivery\s+status|when\s+will.*arrive|my\s+order|nvm-\d+)\b/i.test(lower)) {
    return { intent: 'order_status', confidence: 0.85 };
  }

  // Returns/refunds patterns
  if (/\b(return|refund|exchange|send\s+back|money\s+back|return\s+policy|refund\s+status|warranty|defective|damaged|broken)\b/i.test(lower)) {
    return { intent: 'returns_refunds', confidence: 0.85 };
  }

  // Account patterns
  if (/\b(password|login|log\s*in|sign\s*in|account|profile|two.?factor|2fa|delete\s+my\s+account)\b/i.test(lower)) {
    return { intent: 'account', confidence: 0.85 };
  }

  // Billing patterns
  if (/\b(payment|billing|charge|invoice|credit\s+card|paypal|gift\s+card|price\s+match|klarna)\b/i.test(lower)) {
    return { intent: 'billing', confidence: 0.85 };
  }

  // Technical patterns
  if (/\b(bug|crash|not\s+working|error|app|website|can't\s+load|won't\s+open|broken\s+page|clear\s+cache)\b/i.test(lower)) {
    return { intent: 'technical', confidence: 0.8 };
  }

  // Small talk patterns
  if (/^(thanks|thank\s+you|ok|okay|got\s+it|bye|goodbye|see\s+you|cheers|cool|nice)\b/i.test(lower)) {
    return { intent: 'small_talk', confidence: 0.8 };
  }

  return null; // No confident match — will use LLM
}

/**
 * Classify user message intent
 * Tries local keyword matching first, falls back to LLM for ambiguous messages
 */
export async function classifyIntent(message, history = []) {
  // Try local classification first (free, instant)
  const localResult = localClassify(message);
  if (localResult) return localResult;

  // Fall back to LLM for ambiguous messages
  const historyContext = history.slice(-3).map(m =>
    `${m.role}: ${m.content}`
  ).join('\n');

  const prompt = `Classify the customer support message intent. Choose exactly one category.

Categories:
- faq: General questions about policies, features, company info
- order_status: Tracking orders, delivery status, shipping updates
- billing: Payment issues, invoices, charges, payment methods
- technical: App/website bugs, login issues, technical problems
- account: Account creation, updates, deletion, password reset
- returns_refunds: Return requests, refund status, exchange policy
- escalation: Explicit request to talk to human/agent/manager
- small_talk: Greetings, thanks, casual conversation
- greeting: Initial hello/hi messages

${historyContext ? `Recent conversation:\n${historyContext}\n\n` : ''}Customer message: "${message}"

Respond with JSON: {"intent": "<category>", "confidence": <0.0-1.0>}`;

  try {
    const result = await generateJSON(prompt, { useLite: true, temperature: 0.1 });
    if (result && INTENT_CATEGORIES.includes(result.intent)) {
      return result;
    }
    return { intent: 'faq', confidence: 0.5 };
  } catch (err) {
    console.error('[Intent] Classification error:', err.message);
    return { intent: 'faq', confidence: 0.3 };
  }
}
