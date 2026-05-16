# AutoScribe: AI-Powered Documentation Generator

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

# GitHub API settings
GITHUB_API_URL=https://api.github.com
GITHUB_API_USERNAME=your_github_username

# Documentation settings
DOC_GENERATION_MODE=auto
DOC_OUTPUT_FORMAT=markdown
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

10 tests across incremental update, staleness detection, and documentation generation.

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
│   │   │   └── staleness.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   ├── doc_generator.py
│   │   │   ├── github_fetch.py
│   │   │   ├── incremental_updater.py
│   │   │   ├── parser.py
│   │   │   ├── rag.py
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
│   ├── test/
│   │   ├── test_health.py
│   │   ├── test_incremental_update.py
│   │   └── test_staleness.py
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

1. User creates a **repository** and adds it to AutoScribe
2. AutoScribe **parses** the repository and generates documentation (`docs_gen.py`)
3. Documentation is **stored** in the database (`database.py`)
4. User can **search** for specific documentation (`search.py`)
5. AutoScribe **detects staleness** in the repository and updates documentation (`staleness.py`)
6. User can **edit** documentation using the prompt editor (`prompt_editor.py`)
7. AutoScribe **generates** new documentation based on user input (`docs_gen.py`)

---

## ✨ Features

### Core Features
- 📄 **Automatic documentation generation** — generates documentation for your repository
- 🤖 **AI-powered documentation editing** — uses AI to assist with documentation editing
- 🔍 **Search functionality** — search for specific documentation
- 🧠 **Staleness detection** — detects when documentation is out of date
- 🎯 **Incremental updates** — updates documentation incrementally

### Repository Management
- 📂 **Repository system** — manage multiple repositories
- 🧠 **Multi-repository support** — supports multiple repositories simultaneously
- 🗂️ **Repository management** — add, remove, and rename repositories
- 📝 **Repository renaming** — update repository names on the fly
- 🗑️ **Repository deletion** — remove repositories and associated documentation

### Advanced UI Features
- ⚡ **Streaming responses** — documentation reveals progressively with typing effect
- 🔎 **Search highlighting** — click search results to highlight matching text
- 🎨 **Modern SaaS UI** — polished interface with accent colors and smooth animations
- 🌈 **Gradient design system** — works across desktop and mobile devices

### AI-Powered Features
- 💬 **Documentation suggestions** — suggests documentation based on user input
- 📊 **Documentation comparison** — compare documentation across multiple repositories
- 🔍 **Detailed documentation** — generates detailed documentation for specific topics
- 📄 **Report generation** — generates reports based on documentation
