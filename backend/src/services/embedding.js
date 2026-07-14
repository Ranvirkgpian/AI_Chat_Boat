// Embedding Service — Gemini Embedding API with graceful 429 fallback
import { GoogleGenAI } from '@google/genai';

const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';
let ai = null;

function getClient() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

/**
 * Generate embedding vector for a text string
 * Falls back to mockEmbedding on any API error (including 429)
 */
export async function embedText(text) {
  const client = getClient();
  if (!client) {
    return mockEmbedding(text);
  }

  try {
    const response = await client.models.embedContent({
      model: `models/${EMBEDDING_MODEL}`,
      contents: [{ role: 'user', parts: [{ text }] }],
    });
    return response.embeddings[0].values;
  } catch (err) {
    console.warn(`[Embedding] API error (${err.status || 'unknown'}), using mock embedding`);
    return mockEmbedding(text);
  }
}

/**
 * Batch embed multiple texts
 */
export async function embedBatch(texts) {
  const embeddings = [];
  for (const text of texts) {
    const embedding = await embedText(text);
    embeddings.push(embedding);
  }
  return embeddings;
}

/**
 * Generate a simple mock embedding for demo/testing without API key
 * Uses a basic hash-based approach to create consistent vectors
 */
function mockEmbedding(text, dim = 256) {
  const vec = new Array(dim).fill(0);
  const words = text.toLowerCase().split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    for (let j = 0; j < words[i].length; j++) {
      const idx = (words[i].charCodeAt(j) * (i + 1) * (j + 1)) % dim;
      vec[idx] += 1 / words.length;
    }
  }
  // Normalize
  const magnitude = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vec.map(v => v / magnitude);
}
