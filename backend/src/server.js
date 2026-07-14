// FlowSupport Backend — Express + Socket.IO Server Entry Point
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load .env from the project root (two directories up from src/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';

import { dbPromise } from './db/connection.js';
import authRoutes from './routes/auth.js';
import kbRoutes from './routes/kb.js';
import ticketRoutes from './routes/tickets.js';
import analyticsRoutes from './routes/analytics.js';
import conversationRoutes from './routes/conversations.js';
import { setupChatHandlers } from './socket/chatHandler.js';
import { rateLimit } from './middleware/rateLimit.js';
import { reindexAll } from './services/rag.js';

async function startServer() {
  // Wait for database to initialize
  await dbPromise;
  console.log('[DB] Database ready');

  const app = express();
  const httpServer = createServer(app);

  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
  const PORT = process.env.PORT || 3001;

  // Socket.IO with CORS
  const io = new Server(httpServer, {
    cors: {
      origin: [FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'],
      methods: ['GET', 'POST'],
    },
  });

  // Middleware
  app.use(cors({
    origin: [FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  }));
  app.use(morgan('dev'));
  app.use(express.json({ limit: '10mb' }));

  // Rate limiting on chat-related endpoints
  app.use('/api/chat', rateLimit);

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/kb', kbRoutes);
  app.use('/api/tickets', ticketRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/conversations', conversationRoutes);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Setup Socket.IO chat handlers
  setupChatHandlers(io);

  // Start server
  httpServer.listen(PORT, async () => {
    console.log(`\n🚀 FlowSupport Backend running on http://localhost:${PORT}`);
    console.log(`📡 Socket.IO ready for connections`);
    console.log(`🔗 Frontend expected at ${FRONTEND_URL}\n`);

    // Reindex KB articles into vector store on startup
    try {
      await reindexAll();
    } catch (err) {
      console.error('[Startup] Error reindexing KB:', err.message);
    }
  });
}

startServer().catch(err => {
  console.error('[Server] Fatal error:', err);
  process.exit(1);
});
