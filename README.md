# AutoScribe: AI-Powered Documentation Generation

![Cover Image](./assets/cover.png)

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js (v16+)
- GitHub API Token

---

## ⚙️ Installation & Setup

### 1. Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create `.env` inside `backend/`:

```env
GITHUB_API_TOKEN=your_api_token_here

# Models
DOC_GENERATION_MODEL=transformer-based

# Storage
STORAGE_BASE=storage

# Repository settings
REPO_OWNER=SudeshDahale
REPO_NAME=AutoScribe
```

Start backend server:

```bash
uvicorn main:app --reload --port 8000
```

---

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`

---

## 🧪 Running Tests

```bash
cd backend
pytest tests/ -v
```

10 tests across repository parsing, documentation generation, and API endpoints.

---

## 📁 Project Structure
```
AutoScribe/
├── backend/
│   ├── main.py
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py
│   │   │   ├── docs_gen.py
│   │   │   ├── health.py
│   │   │   ├── parse.py
│   │   │   ├── prompt_editor.py
│   │   │   ├── repositories.py
│   │   │   ├── search.py
│   │   │   ├── staleness.py
│   │   │   └── webhooks.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   ├── doc_generator.py
│   │   │   ├── github_fetch.py
│   │   │   ├── incremental_updater.py
│   │   │   ├── parser.py
│   │   │   ├── rag.py
│   │   │   ├── scheduler.py
│   │   │   └── staleness_detector.py
│   │   ├── models/
│   │   │   ├── analysis_job.py
│   │   │   ├── documentation.py
│   │   │   ├── file_snapshot.py
│   │   │   ├── parsed_file.py
│   │   │   ├── repository.py
│   │   │   ├── user.py
│   │   │   └── webhook_config.py
│   │   └── workers/
│   │       └── tasks.py
│   ├── migrations/
│   │   └── add_staleness_tables.py
│   ├── tests/
│   │   ├── test_incremental_update.py
│   │   ├── test_staleness.py
│   │   └── test_health.py
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.tsx
    │   ├── components/
    │   │   ├── LoginPage.tsx
    │   │   ├── PromptEditorModal.tsx
    │   │   ├── Sidebar.tsx
    │   │   ├── StatsStrip.tsx
    │   │   ├── TabBar.tsx
    │   │   └── TopBar.tsx
    │   ├── constants.ts
    │   └── types.ts
    ├── package.json
    └── vite.config.js
```
---

## 🏗️ System Architecture

![AutoScribe Pipeline](./assets/autoscribe-pipeline.svg)

### Pipeline

1. User authenticates with GitHub and grants repository access
2. AutoScribe fetches repository data and generates documentation (`docs_gen.py`)
3. Documentation is stored in the database and made available via API endpoints (`api/docs_gen.py`)
4. User can search and filter documentation using the search bar (`search.py`)
5. AutoScribe continuously monitors repository staleness and triggers updates (`staleness.py`)
6. Updates are processed in the background using Celery workers (`workers/tasks.py`)
7. User can view repository analytics and documentation metrics (`repositories.py`)

---

## ✨ Features

### Core Features
- 📄 **Automated documentation generation** — generates high-quality documentation for your repository
- 🤖 **AI-powered search** — search and filter documentation using natural language queries
- 📊 **Repository analytics** — view metrics and insights about your repository
- 📝 **Customizable documentation** — customize the appearance and content of your documentation
- 📈 **Continuous integration** — AutoScribe continuously monitors and updates your documentation

### Advanced Features
- 📁 **Multi-repository support** — manage and generate documentation for multiple repositories
- 📊 **Detailed analytics** — view detailed metrics and insights about your repository
- 📝 **Collaboration tools** — collaborate with others on documentation and repository management
- 📈 **Webhook integration** — integrate AutoScribe with your existing workflow using webhooks

### UI Features
- ⚡ **Responsive design** — works across desktop and mobile devices
- 🌈 **Modern design** — polished interface with accent colors and smooth animations
- 📱 **Streamlined navigation** — easy-to-use navigation and search functionality
- 📊 **Real-time updates** — documentation and analytics update in real-time