// Vector Store — In-memory cosine similarity search with disk persistence
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE_PATH = process.env.VECTOR_STORE_PATH
  ? path.resolve(__dirname, '../..', process.env.VECTOR_STORE_PATH)
  : path.resolve(__dirname, '../../data/vectors.json');

class VectorStore {
  constructor() {
    this.vectors = []; // { id, articleId, chunkIndex, text, embedding }
    this.load();
  }

  /** Load persisted vectors from disk */
  load() {
    try {
      if (fs.existsSync(STORE_PATH)) {
        const data = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
        this.vectors = data;
        console.log(`[VectorStore] Loaded ${this.vectors.length} vectors from disk`);
      }
    } catch (err) {
      console.error('[VectorStore] Error loading vectors:', err.message);
      this.vectors = [];
    }
  }

  /** Persist vectors to disk */
  save() {
    try {
      const dir = path.dirname(STORE_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(STORE_PATH, JSON.stringify(this.vectors));
    } catch (err) {
      console.error('[VectorStore] Error saving vectors:', err.message);
    }
  }

  /**
   * Add vectors for a KB article's chunks
   * @param {number} articleId 
   * @param {Array<{text: string, embedding: number[]}>} chunks 
   */
  addArticleChunks(articleId, chunks) {
    // Remove existing vectors for this article
    this.vectors = this.vectors.filter(v => v.articleId !== articleId);
    // Add new chunks
    for (let i = 0; i < chunks.length; i++) {
      this.vectors.push({
        id: `${articleId}-${i}`,
        articleId,
        chunkIndex: i,
        text: chunks[i].text,
        embedding: chunks[i].embedding,
      });
    }
    this.save();
  }

  /** Remove all vectors for an article */
  removeArticle(articleId) {
    this.vectors = this.vectors.filter(v => v.articleId !== articleId);
    this.save();
  }

  /**
   * Search for the most similar vectors
   * @param {number[]} queryEmbedding 
   * @param {number} topK - Number of results
   * @returns {Array<{articleId: number, chunkIndex: number, text: string, score: number}>}
   */
  search(queryEmbedding, topK = 5) {
    if (this.vectors.length === 0) return [];

    const scored = this.vectors.map(v => ({
      articleId: v.articleId,
      chunkIndex: v.chunkIndex,
      text: v.text,
      score: cosineSimilarity(queryEmbedding, v.embedding),
    }));

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Deduplicate by articleId — keep best chunk per article
    const seen = new Set();
    const results = [];
    for (const item of scored) {
      if (!seen.has(item.articleId) && results.length < topK) {
        seen.add(item.articleId);
        results.push(item);
      }
    }

    return results;
  }

  /** Get the count of vectors */
  get size() {
    return this.vectors.length;
  }

  /** Clear all vectors */
  clear() {
    this.vectors = [];
    this.save();
  }
}

/** Cosine similarity between two vectors */
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}

// Singleton instance
const vectorStore = new VectorStore();
export default vectorStore;
