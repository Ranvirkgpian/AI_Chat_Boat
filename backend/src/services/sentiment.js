// Sentiment Analysis — Local keyword scoring + Gemini Flash Lite fallback
import { generateJSON } from './llm.js';

/**
 * Fast local keyword-based sentiment analysis
 * Returns null if no confident match (falls through to LLM)
 */
function localSentiment(message) {
  const lower = message.toLowerCase();

  // Strong negative signals
  const escalationWords = ['sue', 'lawyer', 'legal', 'complaint', 'report', 'bbb'];
  if (escalationWords.some(w => lower.includes(w))) {
    return { score: -0.9, label: 'negative', frustration: 5 };
  }

  const negativeWords = ['frustrated', 'angry', 'terrible', 'worst', 'unacceptable',
    'ridiculous', 'furious', 'hate', 'awful', 'horrible', 'disgusting', 'outrageous',
    'scam', 'rip off', 'waste', 'pathetic', 'useless'];
  const negCount = negativeWords.filter(w => lower.includes(w)).length;
  if (negCount >= 2) return { score: -0.8, label: 'negative', frustration: 4 };
  if (negCount === 1) return { score: -0.6, label: 'negative', frustration: 3 };

  // Positive signals
  const positiveWords = ['thanks', 'thank you', 'great', 'awesome', 'perfect',
    'love', 'excellent', 'helpful', 'amazing', 'wonderful', 'appreciate',
    'fantastic', 'good job', 'well done', 'impressed'];
  const posCount = positiveWords.filter(w => lower.includes(w)).length;
  if (posCount >= 2) return { score: 0.8, label: 'positive', frustration: 1 };
  if (posCount === 1) return { score: 0.6, label: 'positive', frustration: 1 };

  return null; // Ambiguous — use LLM
}

/**
 * Analyze sentiment of a user message
 * Tries local keyword scoring first, falls back to LLM for ambiguous messages
 */
export async function analyzeSentiment(message) {
  // Try local classification first (free, instant)
  const localResult = localSentiment(message);
  if (localResult) return localResult;

  const prompt = `Analyze the sentiment of this customer support message.

Message: "${message}"

Respond with JSON only:
{
  "score": <float from -1.0 to 1.0, where -1 is very negative and 1 is very positive>,
  "label": "<positive|neutral|negative>",
  "frustration": <integer from 1 to 5, where 1 is calm and 5 is very frustrated>
}`;

  try {
    const result = await generateJSON(prompt, { useLite: true, temperature: 0.1 });
    if (result && typeof result.score === 'number') {
      return {
        score: Math.max(-1, Math.min(1, result.score)),
        label: result.label || (result.score > 0.2 ? 'positive' : result.score < -0.2 ? 'negative' : 'neutral'),
        frustration: Math.max(1, Math.min(5, result.frustration || 1)),
      };
    }
    return { score: 0, label: 'neutral', frustration: 1 };
  } catch (err) {
    console.error('[Sentiment] Analysis error:', err.message);
    return { score: 0, label: 'neutral', frustration: 1 };
  }
}
