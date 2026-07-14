// RAG Pipeline — Retrieval-Augmented Generation orchestration
import { embedText } from './embedding.js';
import vectorStore from './vectorStore.js';
import { generateStream, generate } from './llm.js';
import db from '../db/connection.js';

const CONFIDENCE_THRESHOLD = 0.3;

/**
 * Chunk a text document into overlapping segments
 * @param {string} text - The full document text
 * @param {number} chunkSize - Target chunk size in characters
 * @param {number} overlap - Overlap between chunks in characters
 * @returns {string[]} - Array of text chunks
 */
export function chunkText(text, chunkSize = 500, overlap = 100) {
  const chunks = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let currentChunk = '';

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      // Keep overlap from the end of current chunk
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.ceil(overlap / 5));
      currentChunk = overlapWords.join(' ') + ' ' + sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }
  if (currentChunk.trim()) chunks.push(currentChunk.trim());
  return chunks.length > 0 ? chunks : [text];
}

/**
 * Ingest a KB article into the vector store
 * @param {number} articleId 
 * @param {string} title 
 * @param {string} content 
 */
export async function ingestArticle(articleId, title, content) {
  const fullText = `${title}\n\n${content}`;
  const chunks = chunkText(fullText);

  const embeddedChunks = [];
  for (const text of chunks) {
    const embedding = await embedText(text);
    embeddedChunks.push({ text, embedding });
  }

  vectorStore.addArticleChunks(articleId, embeddedChunks);
  console.log(`[RAG] Ingested article ${articleId} (${chunks.length} chunks)`);
}

/**
 * Remove an article from the vector store
 */
export function removeArticle(articleId) {
  vectorStore.removeArticle(articleId);
}

/**
 * Retrieve relevant context for a user query
 * @param {string} query - User's question
 * @param {number} topK - Number of results
 * @returns {Promise<{chunks: Array, articles: Array, confidence: number}>}
 */
export async function retrieve(query, topK = 5) {
  const queryEmbedding = await embedText(query);
  const results = vectorStore.search(queryEmbedding, topK);

  if (results.length === 0) {
    return { chunks: [], articles: [], confidence: 0 };
  }

  // Fetch full article info for sources
  const articles = [];
  for (const r of results) {
    const article = db.prepare('SELECT id, title, category FROM kb_articles WHERE id = ?').get(r.articleId);
    if (article) {
      articles.push({ ...article, score: r.score });
      // Increment retrieval count
      db.prepare('UPDATE kb_articles SET retrieval_count = retrieval_count + 1 WHERE id = ?').run(r.articleId);
    }
  }

  const maxScore = Math.max(...results.map(r => r.score));

  return {
    chunks: results.map(r => r.text),
    articles,
    confidence: maxScore,
  };
}

/**
 * Full RAG pipeline: retrieve → generate grounded answer (streaming)
 * @param {string} query - User's question
 * @param {Array} conversationHistory - Previous messages for context
 * @param {object} options - Additional context (personalization, intent)
 * @returns {AsyncGenerator<{chunk?: string, sources?: Array, confidence?: number, done?: boolean}>}
 */
export async function* ragQuery(query, conversationHistory = [], options = {}) {
  const { chunks, articles, confidence } = await retrieve(query);

  const isLowConfidence = confidence < CONFIDENCE_THRESHOLD && chunks.length > 0;
  const noResults = chunks.length === 0;

  // Build context from retrieved chunks
  const contextBlock = chunks.length > 0
    ? chunks.map((c, i) => `[Source ${i + 1}]: ${c}`).join('\n\n')
    : 'No relevant information found in the knowledge base.';

  // Build conversation history context
  const historyBlock = conversationHistory.slice(-6).map(m =>
    `${m.role === 'user' ? 'Customer' : 'FlowBot'}: ${m.content}`
  ).join('\n');

  // Build personalization context
  const personalizationBlock = options.orderContext
    ? `\nCustomer Order Context:\n${options.orderContext}`
    : '';

  const languageBlock = options.language ? `\n- EXTREMELY IMPORTANT: Translate your response and reply strictly in the ${options.language} language.` : '';

  const systemInstruction = `You are FlowBot, the AI support assistant for NovaMart, an online electronics and lifestyle store. You are warm, competent, and concise — never robotic, never overly apologetic.

RULES:
- Answer ONLY based on the provided knowledge base context. Never invent policy details, prices, or order information.
- Use short paragraphs or bullet points for clarity.
- If the context doesn't contain the answer, say honestly: "I don't have specific information about that in my knowledge base. Let me connect you with a support specialist who can help."
- When referencing information, naturally mention the source topic.
- Ask one clarifying question at a time when information is missing.
- Be helpful and professional but keep responses concise (2-4 sentences for simple queries).
- Format responses with markdown when helpful (bold for emphasis, bullet lists for steps).${languageBlock}`;

  const prompt = `${historyBlock ? `Previous conversation:\n${historyBlock}\n\n` : ''}Knowledge Base Context:\n${contextBlock}${personalizationBlock}

Customer Question: ${query}

Provide a helpful, grounded response based on the knowledge base context above.${isLowConfidence ? ' Note: The retrieved context may not be fully relevant, so be upfront about any uncertainty.' : ''}${noResults ? ' Note: No relevant context was found. Acknowledge this honestly and offer to connect with a human agent.' : ''}`;

  // Stream the response
  const sources = articles.map(a => ({ id: a.id, title: a.title, category: a.category, score: a.score }));

  for await (const textChunk of generateStream(prompt, { systemInstruction })) {
    yield { chunk: textChunk };
  }

  // Final event with metadata
  yield { done: true, sources, confidence };
}

/**
 * Re-ingest all KB articles (used on server startup)
 */
export async function reindexAll() {
  const articles = db.prepare('SELECT id, title, content FROM kb_articles').all();
  console.log(`[RAG] Re-indexing ${articles.length} KB articles...`);
  for (const article of articles) {
    await ingestArticle(article.id, article.title, article.content);
  }
  console.log('[RAG] Re-indexing complete');
}
