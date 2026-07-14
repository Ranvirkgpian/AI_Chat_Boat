# 🚀 FlowSupport — AI-Powered Support Chat Bot

> **Built for the FlowZint AI Hackathon**  
> Get answers instantly. Talk to a human when it matters.

FlowSupport is a production-quality AI support chatbot that resolves ~85% of routine customer queries using RAG-powered knowledge retrieval, intelligently escalates the rest to human agents, and provides a full admin dashboard with live analytics.

## ✨ Features

### 🤖 AI Chat Experience
- **Real-time streaming** bot responses (token-by-token via Socket.IO)
- **RAG-powered answers** grounded in an editable knowledge base — never hallucinated
- **Source attribution** showing which KB articles each answer came from
- **Smart suggestion chips** generated dynamically based on conversation context
- **Markdown rendering** for rich bot responses (lists, bold, code blocks, links)
- **Session memory** with full conversation history

### 🧠 Intelligent AI Pipeline
- **Intent classification** (FAQ, billing, orders, technical, escalation, etc.)
- **Sentiment analysis** on every user message
- **Personalized answers** with mock e-commerce data (order tracking, account info)
- **Escalation engine** — auto-detects frustration, repeated failures, or explicit requests

### 📊 Admin Dashboard
- **Analytics** — Resolution rate, deflection rate, intent distribution, sentiment trends
- **Knowledge Base Manager** — CRUD articles, see retrieval stats, auto-reindex
- **Live Conversations** — Monitor active chats in real time
- **Ticket Queue** — Kanban board (New → In Progress → Resolved)

### 🎨 Premium UI/UX
- **"Aurora Support" design system** — glassmorphism, animated gradients, micro-interactions
- **Dark/light mode** toggle
- **Framer Motion animations** — message bubbles, typing indicator, page transitions
- **Three-column responsive layout** — sidebar, chat thread, smart panel
- **Mobile-optimized** with slide-over drawers

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Landing  │  │  Chat UI │  │ Admin Dashboard   │  │
│  │  Page    │  │(Socket.IO│  │   (REST API)      │  │
│  └──────────┘  │ Client)  │  └───────────────────┘  │
│                └────┬─────┘                          │
└─────────────────────┼────────────────────────────────┘
                      │ WebSocket + REST
┌─────────────────────┼────────────────────────────────┐
│              Express Backend                          │
│  ┌─────────┐ ┌──────────┐ ┌──────────────┐          │
│  │ Intent  │ │Sentiment │ │  Escalation  │          │
│  │Classify │ │ Analysis │ │   Engine     │          │
│  └────┬────┘ └────┬─────┘ └──────┬───────┘          │
│       └───────────┼──────────────┘                   │
│              ┌────┴─────┐                            │
│              │   RAG    │                            │
│              │ Pipeline │                            │
│              └────┬─────┘                            │
│  ┌──────────┐ ┌───┴────┐                            │
│  │  SQLite  │ │ Vector │                            │
│  │   (DB)   │ │ Store  │                            │
│  └──────────┘ └────────┘                            │
└──────────────────────────────────────────────────────┘
```

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS v4, Framer Motion, Zustand, Socket.IO Client |
| Backend | Node.js, Express, Socket.IO, JWT Auth |
| AI/NLP | Gemini 2.5 Flash (chat), Gemini 2.5 Flash Lite (classification), Gemini Embedding 2 (vectors) |
| Database | SQLite via sql.js (zero-setup, file-based) |
| Vector Store | In-memory cosine similarity with JSON persistence |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- A [Google AI Studio](https://aistudio.google.com/) API key (free tier)

### Setup

```bash
# 1. Clone and navigate
cd flowsupport

# 2. Install dependencies
cd backend && npm install
cd ../frontend && npm install
cd ..

# 3. Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# 4. Seed the database
cd backend && npm run seed
cd ..

# 5. Start both servers
cd backend && npm run dev    # → http://localhost:3001
cd frontend && npm run dev   # → http://localhost:5173
```

### Demo Credentials
- **Admin Login**: admin@flowsupport.com / admin123
- **Chat**: No login required — start chatting immediately

## 📁 Project Structure

```
flowsupport/
├── backend/
│   ├── src/
│   │   ├── server.js              # Express + Socket.IO entry
│   │   ├── db/                    # SQLite schema, connection, seed
│   │   ├── routes/                # REST API (auth, kb, tickets, analytics)
│   │   ├── services/              # RAG, LLM, embedding, intent, sentiment
│   │   ├── middleware/            # JWT auth, rate limiting
│   │   └── socket/                # Real-time chat handlers
│   └── data/                      # SQLite DB + vector store (auto-created)
├── frontend/
│   ├── src/
│   │   ├── pages/                 # Landing, Chat, Admin Login, Dashboard
│   │   ├── components/
│   │   │   ├── chat/              # Message bubbles, input, typing, panels
│   │   │   ├── admin/             # KB manager, analytics, tickets
│   │   │   └── ui/                # Glass cards, buttons, avatars
│   │   └── lib/                   # Socket.IO, API client, Zustand stores
├── .env.example                   # Environment config template
├── docker-compose.yml             # Full-stack deployment
├── DECISIONS.md                   # Architectural decisions log
└── README.md
```

## 🎯 AI Models Used

| Model | Purpose |
|-------|---------|
| **Gemini 2.5 Flash** | Main chat responses, RAG generation, conversation summaries |
| **Gemini 2.5 Flash Lite** | Intent classification, sentiment analysis |
| **Gemini Embedding 2** | Text embeddings for vector similarity search |

## 📊 Demo Scenarios

1. **RAG Resolution**: Ask "What is your return policy?" → Bot answers from KB with source attribution
2. **Order Tracking**: Ask "Where is my order #4521?" → Personalized response with tracking info
3. **Escalation**: Say "This is unacceptable, I want to talk to a manager" → Escalation triggers, ticket created
4. **Admin Dashboard**: Login as admin → View analytics, manage KB, monitor conversations

## 📝 License

Built for the FlowZint AI Hackathon 2026.
