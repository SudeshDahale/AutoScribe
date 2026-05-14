from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import health, auth, repositories, parse
from app.core.config import settings
from app.core.database import engine, Base

from app.models import user, repository, analysis_job, documentation  # noqa
from app.models.parsed_file import ParsedFile  # noqa

app = FastAPI(
    title="AutoScribe API",
    description="AI-powered documentation automation platform",
    version="0.1.0",
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


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ AutoScribe API starting up — SQLite DB ready")