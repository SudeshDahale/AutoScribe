from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import health, auth, repositories, parse, docs_gen, staleness, webhooks
from app.api import search  # NEW
from app.core.config import settings
from app.core.database import engine, Base

from app.models import user, repository, analysis_job, documentation  # noqa
from app.models.parsed_file import ParsedFile  # noqa
from app.models.file_snapshot import FileSnapshot  # noqa
from app.models.webhook_config import WebhookConfig  # noqa
from app.api import prompt_editor
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.api import auth, repositories, parse, docs_gen, search, staleness, webhooks, prompt_editor
from app.core.scheduler import start_scheduler, stop_scheduler

import logging
logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ───────────────────────────────────────────────────────────────
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    start_scheduler()   # 🚀 autonomous background engine

    yield

    # ── Shutdown ──────────────────────────────────────────────────────────────
    stop_scheduler()
    await engine.dispose()


app = FastAPI(title="AutoScribe API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,          prefix="/api/v1/auth",         tags=["auth"])
app.include_router(repositories.router,  prefix="/api/v1/repositories", tags=["repositories"])
app.include_router(parse.router,         prefix="/api/v1/parse",        tags=["parse"])
app.include_router(docs_gen.router,      prefix="/api/v1/docs",         tags=["docs"])
app.include_router(search.router,        prefix="/api/v1/search",       tags=["search"])
app.include_router(staleness.router,     prefix="/api/v1/staleness",    tags=["staleness"])
app.include_router(webhooks.router,      prefix="/api/v1/webhooks",     tags=["webhooks"])
app.include_router(prompt_editor.router, prefix="/api/v1/prompt",       tags=["prompt"])

app = FastAPI(
    title="AutoScribe API",
    description="AI-powered documentation automation platform",
    version="0.3.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(repositories.router, prefix="/api/v1/repos", tags=["repositories"])
app.include_router(parse.router, prefix="/api/v1/repos", tags=["parse"])
app.include_router(docs_gen.router, prefix="/api/v1/repos", tags=["docs"])
app.include_router(staleness.router, prefix="/api/v1/repos", tags=["staleness"])
app.include_router(webhooks.router, prefix="/api/v1/webhooks", tags=["webhooks"])
app.include_router(search.router, prefix="/api/v1/repos", tags=["search"])  # NEW
app.include_router(prompt_editor.router, prefix="/api/v1/prompt-editor", tags=["prompt-editor"])

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ AutoScribe API starting up — SQLite DB ready")