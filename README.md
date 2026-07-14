# FlowSupport 🤖

**An AI-powered support chatbot with real-time RAG, intelligent escalation, and a live-updating admin dashboard — built for the FlowZint AI Hackathon.**

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://ai-chat-boat-neon.vercel.app)
[![Backend](https://img.shields.io/badge/backend-online-blue)](https://ai-chat-boat-lwxr.onrender.com)

🔗 **Live App:** https://ai-chat-boat-neon.vercel.app
🔗 **Backend API:** https://ai-chat-boat-lwxr.onrender.com

> ⚠️ Note: the backend runs on Render's free tier, which spins down after inactivity. The first request after idle time may take 30–50 seconds to wake up — please give it a moment on first load.

---

## What is FlowSupport?

Most customer support teams spend the majority of their time answering the same repetitive questions — order tracking, refund policies, account issues — while customers who genuinely need a human get stuck in the same queue.

**FlowSupport** is an AI support assistant that:
- Answers routine questions instantly using **real Retrieval-Augmented Generation (RAG)** grounded in an editable knowledge base — not hallucinated guesses.
- Cites its sources on every answer, with live relevance scores, so both the user and the business can trust what it says.
- Detects when a conversation needs a human — via intent, sentiment, and explicit request — and hands off cleanly with an auto-generated summary.
- Gives the business a full **admin dashboard** to monitor live conversations, view analytics, manage the knowledge base, and track escalated tickets — all in real time, with zero redeploy needed to update content.

---

## ✨ Key Features

### Chat Experience
- Real-time, token-by-token streaming responses via Socket.IO
- Source-cited answers with expandable "N sources" attribution
- Dynamic **Smart Panel** showing retrieved knowledge base articles with live relevance percentages, updating per query
- Context-aware follow-up action chips (e.g. "Start a return," "Refund timeline," "Exchange instead") generated based on the conversation
- Auto-generated, human-readable conversation titles in the sidebar
- Full light/dark theme support
- File attachment and voice input support

### AI & RAG Pipeline
- Real semantic embeddings via Google's Gemini Embedding API (`gemini-embedding-001`)
- Custom vector store for similarity search over knowledge base chunks
- Intent classification and sentiment analysis on every message, with local keyword-based fallbacks to reduce API load
- Honest uncertainty handling — the bot explicitly says when it doesn't have enough information, rather than fabricating an answer

### Escalation Engine
- Automatically triggers on explicit requests ("talk to a human"), low retrieval confidence, or negative sentiment signals
- Auto-generates a conversation summary so a human agent isn't starting from zero
- Displays estimated wait time to the user

### Admin Dashboard
- **Live Conversations** — monitor active chats in real time, with escalation status visible at a glance
- **Analytics** — resolution rate, response times, and top user intents computed from real conversation data
- **Knowledge Base Manager** — add, edit, or delete articles live; new content is immediately searchable by the bot with no redeploy
- **Ticket Queue** — Kanban-style view of escalated conversations with auto-generated summaries
- Secure JWT-based authentication

---

## 🛠️ Tech Stack

**Frontend**
- React 18 + Vite
- Tailwind CSS
- Zustand (state management)
- Socket.IO client
- Recharts (analytics visualizations)

**Backend**
- Node.js + Express
- Socket.IO (real-time chat)
- SQLite (via sql.js) for conversations, tickets, KB articles, and users
- Custom in-memory/on-disk vector store for RAG retrieval
- JWT authentication

**AI**
- Google Gemini API
  - `gemini-2.5-flash` for chat generation and streaming
  - `gemini-embedding-001` for semantic embeddings
- Local keyword-based fallbacks for intent/sentiment classification to reduce API usage

**Infrastructure**
- Docker (backend containerization)
- Deployed on **Render** (backend) + **Vercel** (frontend)

---

## 📐 Architecture

```
┌─────────────────────┐         ┌──────────────────────────┐
│   React Frontend      │◄──────►│   Express + Socket.IO      │
│   (Vercel)             │  WSS   │   Backend (Render)         │
│                        │ REST   │                            │
│  - Chat UI             │        │  - RAG Pipeline            │
│  - Smart Panel         │        │  - Intent/Sentiment        │
│  - Admin Dashboard     │        │  - Escalation Engine       │
└─────────────────────┘         │  - JWT Auth                │
                                   └────────────┬─────────────┘
                                                │
                              ┌─────────────────┼─────────────────┐
                              ▼                 ▼                 ▼
                       ┌────────────┐   ┌───────────────┐  ┌──────────────┐
                       │  SQLite DB   │   │  Vector Store   │  │  Gemini API    │
                       │  (sql.js)    │   │  (embeddings)   │  │  (chat + embed)│
                       └────────────┘   └───────────────┘  └──────────────┘
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- A Gemini API key ([Google AI Studio](https://aistudio.google.com/))

### 1. Clone the repo
```bash
git clone https://github.com/Ranvirkgpian/AI_Chat_Boat.git
cd AI_Chat_Boat
```

### 2. Backend setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY and JWT_SECRET
npm run seed      # seeds the demo knowledge base
npm run dev        # starts the backend on http://localhost:3000
```

### 3. Frontend setup
```bash
cd ../frontend
npm install
cp .env.example .env
# Edit .env — set VITE_API_URL and VITE_SOCKET_URL to http://localhost:3000
npm run dev        # starts the frontend on http://localhost:5173
```

### 4. Try it out
- Open `http://localhost:5173` for the chat interface
- Open `http://localhost:5173/admin` and log in with the seeded demo admin account (see `DECISIONS.md` for credentials)

---

## 🔑 Environment Variables

**Backend (`backend/.env`)**
```
GEMINI_API_KEY=your_gemini_api_key
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
JWT_SECRET=your_random_secret_string
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**Frontend (`frontend/.env`)**
```
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

---

## 🎥 Demo

A full walkthrough covering the chat experience, RAG source attribution, escalation flow, and live knowledge-base editing is included in the submission.

**Demo flow highlights:**
1. Ask a routine question → get a streamed, source-cited answer with live relevance scores
2. Click "Talk to a human" → see the escalation banner with an auto-generated summary
3. In the admin dashboard, add a new knowledge base article → immediately ask the bot about it in a new chat and watch it answer correctly, with no redeploy

---

## 📌 Known Limitations

- Backend runs on Render's free tier, so it spins down after inactivity and the SQLite database resets on redeploy (seed script re-runs automatically on deploy).
- Gemini API usage is subject to free-tier rate limits; the app includes local keyword-based fallbacks and mock-embedding degradation to stay functional under quota pressure, but response quality may vary if the quota is exhausted during heavy testing.
- Single demo admin account — no multi-user admin management in this version.

---

## 🏆 Built For

**FlowZint AI Hackathon** — judged on Innovation & Creativity, Real-World Problem Solving, AI Automation, User Experience, and Scalability & Functionality.

---

## 📄 License

This project was built for hackathon submission purposes.
