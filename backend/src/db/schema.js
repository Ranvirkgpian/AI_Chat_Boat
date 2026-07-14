// FlowSupport Database Schema — SQLite
// Tables: users, conversations, messages, tickets, kb_articles, analytics_events

export const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'user')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id INTEGER,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'escalated', 'resolved')),
    title TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'bot', 'agent')),
    content TEXT NOT NULL,
    intent TEXT,
    sentiment_score REAL,
    confidence REAL,
    sources TEXT,
    tokens_used INTEGER DEFAULT 0,
    latency_ms INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK(status IN ('new', 'in_progress', 'resolved')),
    priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
    summary TEXT,
    assigned_to INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS kb_articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    tags TEXT DEFAULT '[]',
    retrieval_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    conversation_id TEXT,
    metadata TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
  CREATE INDEX IF NOT EXISTS idx_conversations_session ON conversations(session_id);
  CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
  CREATE INDEX IF NOT EXISTS idx_kb_category ON kb_articles(category);
  CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
  CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at);
`;
