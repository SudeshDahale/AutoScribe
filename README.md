# AutoScribe
AI-powered documentation automation for GitHub repositories.

![banner](./assets/cover.png)

## What it does

AutoScribe connects to your GitHub account, analyzes your codebase, and automatically generates and maintains documentation — so it never goes stale as your code evolves.

**Key features:**
- GitHub OAuth login — connect your account in one click
- AST-based code parsing via Tree-sitter (Python, JavaScript, TypeScript)
- AI-generated READMEs and function-level docstrings (powered by Groq)
- Staleness detection — flags docs that are out of sync with code changes
- Incremental updates — re-generates only what changed
- GitHub webhook support — auto-triggers on push
- Semantic search + RAG Q&A over your codebase (FAISS + SentenceTransformers)
- Prompt editor — customize and preview doc-generation prompts
- Analytics dashboard — coverage %, staleness counts, doc health scores

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| Backend | FastAPI (Python 3.11+) |
| Database | SQLite (local) / PostgreSQL (production) |
| Auth | GitHub OAuth |
| Background Jobs | Celery + Redis |
| AI / LLM | Groq API |
| Code Parsing | Tree-sitter (Python, JS, TS) |
| Semantic Search | FAISS + SentenceTransformers |

## Getting Started

### Prerequisites

- Python 3.11 or 3.12
- Node.js 18+
- A free [Groq API key](https://console.groq.com) for doc generation

### 1. Clone the repo

```bash
git clone https://github.com/your-username/AutoScribe.git
cd AutoScribe
```

### 2. Set up the backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux
pip install -r requirements.txt
```

### 3. Create `backend/.env`

```env
DATABASE_URL=sqlite+aiosqlite:///./autoscribe.db
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_WEBHOOK_SECRET=your-webhook-secret
GROQ_API_KEY=your-groq-api-key
```

**Getting GitHub credentials:**
1. Go to https://github.com/settings/developers
2. Click **New OAuth App**
3. Set callback URL to `http://localhost:8000/api/v1/auth/github/callback`
4. Copy the Client ID and Client Secret into `.env`

**Getting a Groq API key:**
1. Sign up at https://console.groq.com
2. Create an API key and paste it into `.env` as `GROQ_API_KEY`

### 4. Run the backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### 5. Set up and run the frontend

```bash
cd frontend
npm install
npm run dev
```

### 6. Open the app

- **Frontend:** http://localhost:5173
- **API docs:** http://localhost:8000/docs

### 7. (Optional) Run background workers

Celery workers handle async jobs. You'll need Redis running locally first:

```bash
# In a separate terminal, from the backend directory:
celery -A app.workers.celery_app worker --loglevel=info
```

### 8. (Optional) Deploy with Docker

A `docker-compose.yml` is included for production-style deployment with PostgreSQL, Redis, Celery workers, and the backend all wired together:

```bash
docker-compose up --build
```

## Project Structure

```
AutoScribe/
├── backend/
│   ├── app/
│   │   ├── api/              # Route handlers
│   │   │   ├── auth.py       # GitHub OAuth
│   │   │   ├── repositories.py
│   │   │   ├── parse.py      # AST parsing endpoints
│   │   │   ├── docs_gen.py   # README + docstring generation
│   │   │   ├── staleness.py  # Staleness detection + incremental updates
│   │   │   ├── webhooks.py   # GitHub webhook handler
│   │   │   ├── search.py     # Semantic search + RAG Q&A
│   │   │   ├── prompt_editor.py  # Prompt template management
│   │   │   └── health.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   ├── parser.py           # Tree-sitter AST parser
│   │   │   ├── doc_generator.py    # Groq LLM integration
│   │   │   ├── staleness_detector.py
│   │   │   ├── incremental_updater.py
│   │   │   ├── rag.py              # FAISS vector index + RAG
│   │   │   └── github_fetch.py
│   │   ├── models/           # SQLAlchemy models
│   │   └── workers/          # Celery tasks
│   ├── migrations/
│   ├── test/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── panels/       # Feature panels (Parse, README, Docstrings, Search, ...)
│   │   │   └── ui/           # Reusable UI components
│   │   ├── App.tsx
│   │   └── types.ts
│   └── package.json
├── assets/
├── docker-compose.yml
└── README.md
```

## API Overview

All endpoints are prefixed with `/api/v1`. Full interactive docs are available at `/docs` when the backend is running.

| Tag | Endpoints | Description |
|---|---|---|
| `auth` | `GET /auth/github/login`, `/auth/github/callback` | GitHub OAuth flow |
| `repositories` | `GET/POST/DELETE /repos` | Add, list, and remove repos |
| `parse` | `POST /repos/{id}/parse` | Run Tree-sitter AST parsing |
| `docs` | `POST /repos/{id}/generate-readme`, `/generate-docstrings` | AI doc generation |
| `staleness` | `GET /repos/{id}/staleness`, `POST /repos/{id}/incremental-update` | Staleness detection + incremental updates |
| `webhooks` | `POST /webhooks/github`, `GET/PUT /webhooks/{id}/config` | GitHub webhook integration |
| `search` | `POST /repos/{id}/search`, `/rag-query`, `/index` | Semantic search + RAG Q&A |
| `prompt-editor` | `GET /prompt-editor/templates`, `POST /prompt-editor/preview` | Prompt template management |


## License

MIT
