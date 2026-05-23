# AutoScribe

AI-powered documentation automation for GitHub repositories.

![banner](./assets/cover.png)

## Overview

AutoScribe connects to your GitHub account, analyzes your codebase, and automatically generates and maintains documentation — so it never goes stale as your code evolves.

**Key Features:**
- **GitHub OAuth Integration** — Connect your account with one click
- **AST-Based Code Analysis** — Deep parsing via Tree-sitter for Python, JavaScript, and TypeScript
- **AI-Generated Documentation** — Automated READMEs and function-level docstrings powered by Groq LLM
- **Staleness Detection** — Automatically flags documentation that's out of sync with code changes
- **Incremental Updates** — Regenerates only what changed, saving time and API costs
- **GitHub Webhook Support** — Auto-triggers documentation updates on push events
- **Semantic Search + RAG** — Natural language search over your codebase with Q&A capabilities (FAISS + SentenceTransformers)
- **Customizable Prompts** — Edit and preview doc-generation prompts in real-time
- **Analytics Dashboard** — Track coverage percentages, staleness counts, and documentation health scores

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + TypeScript 6 + Vite 8 + Tailwind CSS 3.4 |
| **Backend** | FastAPI (Python 3.11+) + SQLAlchemy 2.0 |
| **Database** | SQLite (development) / PostgreSQL 16 (production) |
| **Authentication** | GitHub OAuth 2.0 |
| **Background Jobs** | Celery 5.4 + Redis 7 |
| **AI / LLM** | Groq API (Llama 3, Mixtral) |
| **Code Parsing** | Tree-sitter 0.21 (Python, JavaScript, TypeScript grammars) |
| **Semantic Search** | FAISS 1.8 + SentenceTransformers 3.0 |
| **Task Scheduling** | APScheduler 3.10 |
| **Version Control** | GitPython 3.1 |

## Getting Started

### Prerequisites

- **Python** 3.11 or 3.12
- **Node.js** 18+ and npm
- **Redis** (for background jobs; optional for basic usage)
- **Groq API Key** — Free tier available at [console.groq.com](https://console.groq.com)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/AutoScribe.git
cd AutoScribe
```

### 2. Backend Setup

#### Install Python Dependencies

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

#### Configure Environment Variables

Create a `backend/.env` file:

```env
# Database
DATABASE_URL=sqlite+aiosqlite:///./autoscribe.db

# Redis (required for Celery workers)
REDIS_URL=redis://localhost:6379/0

# Security
SECRET_KEY=your-secret-key-generate-a-strong-random-string

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_WEBHOOK_SECRET=your-webhook-secret

# AI / LLM
GROQ_API_KEY=your-groq-api-key
```

#### Obtaining GitHub OAuth Credentials

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in the form:
   - **Application name:** AutoScribe
   - **Homepage URL:** `http://localhost:5173`
   - **Authorization callback URL:** `http://localhost:8000/api/v1/auth/github/callback`
4. Click **Register application**
5. Copy the **Client ID** and generate a **Client Secret**
6. Add both to your `.env` file

#### Obtaining a Groq API Key

1. Sign up at [Groq Console](https://console.groq.com)
2. Navigate to **API Keys**
3. Click **Create API Key**
4. Copy the key and add it to `.env` as `GROQ_API_KEY`

### 3. Run the Backend

```bash
# From the backend directory
uvicorn app.main:app --reload --port 8000
```

The API will be available at:
- **API:** http://localhost:8000
- **Interactive Docs:** http://localhost:8000/docs
- **OpenAPI Schema:** http://localhost:8000/openapi.json

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at: http://localhost:5173

**Mac (Homebrew):**
```bash
brew install redis
brew services start redis
```

**Linux (apt):**
```bash
sudo apt install redis-server
sudo systemctl start redis
```

This will start:
- PostgreSQL database on port 5432
- FastAPI backend on port 8000
- Vite frontend on port 5173

## Project Structure

```
AutoScribe/
├── backend/
│   ├── app/
│   │   ├── api/                    # API route handlers
│   │   │   ├── auth.py             # GitHub OAuth flow
│   │   │   ├── repositories.py     # Repo CRUD operations
│   │   │   ├── parse.py            # AST parsing endpoints
│   │   │   ├── docs_gen.py         # README & docstring generation
│   │   │   ├── staleness.py        # Staleness detection & updates
│   │   │   ├── webhooks.py         # GitHub webhook integration
│   │   │   ├── search.py           # Semantic search & RAG Q&A
│   │   │   ├── prompt_editor.py    # Prompt template management
│   │   │   └── health.py           # Health check endpoint
│   │   ├── core/
│   │   │   ├── config.py           # App configuration
│   │   │   ├── database.py         # SQLAlchemy setup
│   │   │   ├── parser.py           # Tree-sitter AST parser
│   │   │   ├── doc_generator.py    # Groq LLM integration
│   │   │   ├── staleness_detector.py
│   │   │   ├── incremental_updater.py
│   │   │   ├── rag.py              # FAISS vector store & RAG
│   │   │   ├── scheduler.py        # APScheduler config
│   │   │   └── github_fetch.py     # GitHub API client
│   │   ├── models/                 # SQLAlchemy ORM models
│   │   │   ├── user.py
│   │   │   ├── repository.py
│   │   │   ├── parsed_file.py
│   │   │   ├── documentation.py
│   │   │   ├── file_snapshot.py
│   │   │   ├── webhook_config.py
│   │   │   └── analysis_job.py
│   │   └── workers/                # Celery tasks
│   │       ├── celery_app.py
│   │       └── tasks.py
│   ├── migrations/                 # Alembic database migrations
│   ├── test/                       # Unit and integration tests
│   ├── requirements.txt
│   ├── alembic.ini
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── panels/             # Feature-specific panels
│   │   │   │   ├── ParsePanel.tsx
│   │   │   │   ├── ReadmePanel.tsx
│   │   │   │   ├── DocstringsPanel.tsx
│   │   │   │   ├── StalenessPanel.tsx
│   │   │   │   ├── SearchPanel.tsx
│   │   │   │   ├── WebhookPanel.tsx
│   │   │   │   └── AnalyticsPanel.tsx
│   │   │   └── ui/                 # Reusable UI components
│   │   │       ├── Badge.tsx
│   │   │       ├── Spinner.tsx
│   │   │       ├── CoverageRing.tsx
│   │   │       ├── HealthPill.tsx
│   │   │       ├── StatCard.tsx
│   │   │       ├── ErrorMsg.tsx
│   │   │       ├── EmptyState.tsx
│   │   │       └── MarkdownRenderer.tsx
│   │   ├── pages/
│   │   │   ├── RepositoriesPage.tsx
│   │   │   └── PromptsPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   ├── TabBar.tsx
│   │   ├── StatsStrip.tsx
│   │   ├── PromptEditorModal.tsx
│   │   ├── App.tsx
│   │   ├── api.ts                  # API client
│   │   ├── types.ts                # TypeScript interfaces
│   │   └── constants.ts
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── assets/
│   └── cover.png
├── .github/
│   └── workflows/
│       └── ci.yml                  # GitHub Actions CI/CD
├── docker-compose.yml
├── .gitignore
└── README.md
```

## API Documentation

All endpoints are prefixed with `/api/v1`. Full interactive documentation is available at `/docs` when the backend is running.

### Endpoint Overview

| Tag | Endpoints | Description |
|---|---|---|
| **auth** | `GET /auth/github/login`<br>`GET /auth/github/callback` | GitHub OAuth authentication flow |
| **repositories** | `GET /repos`<br>`POST /repos`<br>`DELETE /repos/{id}` | Repository management (add, list, remove) |
| **parse** | `POST /repos/{id}/parse` | Trigger AST parsing via Tree-sitter |
| **docs** | `POST /repos/{id}/generate-readme`<br>`POST /repos/{id}/generate-docstrings` | AI-powered documentation generation |
| **staleness** | `GET /repos/{id}/staleness`<br>`POST /repos/{id}/incremental-update` | Detect stale docs and trigger incremental updates |
| **webhooks** | `POST /webhooks/github`<br>`GET /webhooks/{id}/config`<br>`PUT /webhooks/{id}/config` | GitHub webhook integration and configuration |
| **search** | `POST /repos/{id}/search`<br>`POST /repos/{id}/rag-query`<br>`POST /repos/{id}/index` | Semantic search and RAG-based Q&A over codebase |
| **prompt-editor** | `GET /prompt-editor/templates`<br>`POST /prompt-editor/preview` | View and customize doc-generation prompts |
| **health** | `GET /health` | API health check |

### Example: Adding a Repository

```bash
curl -X POST "http://localhost:8000/api/v1/repos" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "github_url": "https://github.com/username/repo-name",
    "branch": "main"
  }'
```

### Example: Generating Documentation

```bash
# Generate README
curl -X POST "http://localhost:8000/api/v1/repos/1/generate-readme" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Generate docstrings for all parsed files
curl -X POST "http://localhost:8000/api/v1/repos/1/generate-docstrings" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Features in Detail

### 1. AST-Based Code Parsing

AutoScribe uses Tree-sitter to perform Abstract Syntax Tree (AST) parsing, extracting:
- Function signatures and bodies
- Class definitions and methods
- Existing docstrings
- Import statements
- File-level structure

Supported languages: **Python**, **JavaScript**, **TypeScript**

### 2. AI Documentation Generation

Powered by Groq's LLM API (Llama 3, Mixtral models), AutoScribe generates:
- **README files** — High-level project overviews with usage examples
- **Function docstrings** — Google/NumPy-style docstrings with parameters, returns, and examples

### 3. Staleness Detection

Monitors code changes and flags documentation that's out of sync by:
- Comparing file hashes against snapshots
- Tracking AST structure changes
- Identifying modified functions without updated docs

### 4. Incremental Updates

Instead of regenerating all documentation on every change:
- Detects which files and functions changed
- Regenerates only affected documentation
- Reduces API costs and processing time by 70-90%

### 5. Semantic Search + RAG

Query your codebase in natural language:
- **Semantic Search:** "Find all database connection functions"
- **RAG Q&A:** "How does authentication work in this project?"

Uses FAISS for efficient vector similarity search and SentenceTransformers for embeddings.

### 6. GitHub Webhooks

Automatically trigger documentation updates when code is pushed:
1. Configure webhook in your GitHub repo settings
2. Point to `https://your-domain.com/api/v1/webhooks/github`
3. AutoScribe re-parses and updates docs on every push

## Development Roadmap

### ✅ Completed (v1.0)
- [x] GitHub OAuth authentication
- [x] Repository management
- [x] AST parsing engine (Python, JS, TS)
- [x] AI documentation generation
- [x] Celery background workers
- [x] Staleness detection
- [x] Incremental updates
- [x] Semantic search + RAG
- [x] Analytics dashboard
- [x] Prompt editor
- [x] GitHub webhook integration

### 🚧 In Progress
- [ ] Pull request bot integration
- [ ] Multi-language support (Go, Rust, Java)
- [ ] Documentation versioning
- [ ] Team collaboration features

### 📋 Planned
- [ ] VS Code extension
- [ ] Slack/Discord notifications
- [ ] Custom LLM provider support (OpenAI, Claude, local models)
- [ ] Documentation diff viewer
- [ ] API rate limiting and usage analytics

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Common Issues

**"Module not found" errors:**
```bash
# Reinstall dependencies
cd backend
pip install -r requirements.txt --force-reinstall
```


**GitHub OAuth callback not working:**
- Verify callback URL in GitHub app settings matches `http://localhost:8000/api/v1/auth/github/callback`
- Check that GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are set correctly in `.env`

**Groq API rate limits:**
- Free tier: 30 requests/minute
- Upgrade to paid tier for higher limits
- Use incremental updates to minimize API calls

## License

MIT License - see [LICENSE](LICENSE) for details.

