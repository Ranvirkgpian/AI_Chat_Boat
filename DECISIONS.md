# FlowSupport — Architectural Decisions Log

## Decision 1: SQLite over PostgreSQL
**Context**: The spec recommends PostgreSQL, but this is a hackathon build.
**Decision**: Use SQLite via `better-sqlite3` for zero-setup, file-based storage.
**Rationale**: Eliminates Docker dependency for local dev, instant setup, same SQL interface. The database layer is abstracted so swapping to PostgreSQL requires only changing the connection module.
**Trade-off**: No concurrent write scaling — acceptable for a demo.

## Decision 2: In-Memory Vector Store over ChromaDB
**Context**: ChromaDB requires a separate Python server or WASM build.
**Decision**: Build a lightweight in-memory vector store with cosine similarity search, persisted to a JSON file.
**Rationale**: Faster to build, no external dependencies, sufficient for demo-scale KB (~100-500 documents). Same embedding + search interface as a production vector DB.
**Trade-off**: Won't scale to millions of documents — but a hackathon KB won't have millions.

## Decision 3: Gemini Model Assignments
**Context**: Multiple Gemini models available with different strengths.
**Decision**:
- **Gemini 2.5 Flash**: Main chat LLM (streaming responses, RAG generation, conversation summaries)
- **Gemini 2.5 Flash Lite**: Intent classification + sentiment analysis (fast, lightweight tasks)
- **Gemini Embedding 2**: Text embeddings for vector store
- **Gemini 3.5 Live Translate**: Multilingual support (stretch feature)
**Rationale**: Match model capability to task complexity. Flash Lite saves latency/cost on classification tasks that don't need full reasoning.

## Decision 4: Session-Based Auth for Chat, JWT for Admin
**Context**: Chat users don't need accounts to start chatting.
**Decision**: Anonymous chat sessions identified by a generated session ID stored in the browser. Admin dashboard requires JWT login.
**Rationale**: Reduces friction to start chatting (key UX goal). Admin auth prevents unauthorized KB/ticket access.

## Decision 5: Mock E-Commerce API
**Context**: Spec calls for fetching order history from a mock e-commerce API.
**Decision**: Build a simple mock data layer within the backend that returns realistic order/account data for demo user sessions.
**Rationale**: No external API dependency, fully deterministic for demo, shows the personalization capability without requiring a real e-commerce backend.

## Decision 6: Prompt-Based Classification over ML Models
**Context**: Intent and sentiment classification could use fine-tuned models or prompt engineering.
**Decision**: Use prompt-based classification via Gemini 2.5 Flash Lite with structured JSON output.
**Rationale**: No training data needed, instantly deployable, quality is sufficient for support domain classification. Production upgrade path would be a fine-tuned classifier.

## Decision 7: Tailwind CSS v4
**Context**: The spec recommends Tailwind CSS.
**Decision**: Use Tailwind CSS v4 (latest stable) with the Vite plugin for optimal integration.
**Rationale**: Best developer experience with Vite, automatic content detection, native CSS nesting support.
