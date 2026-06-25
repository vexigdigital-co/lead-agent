# AI Lead Capture Agent

Full-stack AI-powered lead capture system.

## Stack

| Layer    | Tech                              |
|----------|-----------------------------------|
| Frontend | React + TypeScript + Tailwind v4  |
| Backend  | Node.js + Express + TypeScript    |
| Database | PostgreSQL + Prisma ORM           |
| Validation | Zod (front + back)              |
| AI (Phase 2) | OpenAI → Ollama             |
| Queue (Phase 3) | BullMQ + Redis           |

## Project structure

```
lead-agent/
├── frontend/               # React app (port 5173)
│   └── src/
│       ├── components/     # Shared UI components
│       ├── pages/          # Route pages
│       ├── lib/            # API client
│       └── types/          # Shared TypeScript types
│
└── backend/                # Express API (port 3001)
    └── src/
        ├── routes/         # leads.ts, chat.ts
        ├── middleware/      # errorHandler.ts
        ├── lib/            # prisma.ts singleton
        ├── types/          # Zod schemas + types
        └── index.ts        # App entry point
```

## Setup

### 1. PostgreSQL

```bash
# macOS
brew install postgresql@16 && brew services start postgresql@16

# Create DB
createdb lead_agent_db
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL

npm install
npm run db:generate   # generate Prisma client
npm run db:push       # push schema to DB (dev)
npm run dev           # start on :3001
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev           # start on :5173
```

## API endpoints

```
GET    /api/health
GET    /api/leads              ?score=HOT&search=&page=1&limit=20
GET    /api/leads/:id
POST   /api/leads
PATCH  /api/leads/:id
DELETE /api/leads/:id

POST   /api/chat/start         → { sessionId, messages[] }
POST   /api/chat/message       → { sessionId, message }
GET    /api/chat/:sessionId
PATCH  /api/chat/:sessionId/end
```

## Phase 2 — where to add the AI agent

Open `backend/src/routes/chat.ts` and look for:

```ts
// ── Phase 2: AI agent response goes here ─────────────────────────────────
```

Replace the stub with:
```ts
const aiReply = await conversationAgent.respond(conversation, message)
```

## Phase roadmap

- ✅ Phase 1 — Scaffold, DB schema, API, frontend shell
- ⬜ Phase 2 — OpenAI conversation agent + field extraction
- ⬜ Phase 3 — Qualifier agent + BullMQ queue + notifications
- ⬜ Phase 4 — Ollama swap + LangGraph + CRM integrations
