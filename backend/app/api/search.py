"""
API endpoints for Semantic Search + RAG (Sprint 7).
"""
import json
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.core.rag import index_repo, search_repo, rag_query, get_index_stats
from app.models.user import User
from app.models.repository import Repository
from app.models.parsed_file import ParsedFile

router = APIRouter()


# ── Auth helper (same pattern used everywhere in the codebase) ────────────────

async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    token = authorization.removeprefix("Bearer ").strip()
    result = await db.execute(select(User).where(User.access_token == token))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def _get_repo(repo_id: int, user: User, db: AsyncSession) -> Repository:
    result = await db.execute(
        select(Repository).where(
            Repository.id == repo_id,
            Repository.user_id == user.id,
        )
    )
    repo = result.scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    return repo


# ── Request bodies ─────────────────────────────────────────────────────────────

class SearchRequest(BaseModel):
    query: str
    n_results: int = 8


class RAGRequest(BaseModel):
    question: str


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/{repo_id}/index")
async def index_repository(
    repo_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Embed all parsed symbols for a repo into ChromaDB.
    Must have parsed the repo first.
    """
    await _get_repo(repo_id, current_user, db)

    result = await db.execute(
        select(ParsedFile).where(ParsedFile.repo_id == repo_id)
    )
    parsed_files = result.scalars().all()

    if not parsed_files:
        raise HTTPException(
            status_code=400,
            detail="No parsed files found. Run ⚙ Parse first.",
        )

    files_data = [
        {
            "file_path": f.file_path,
            "language": f.language,
            "symbols": json.loads(f.symbols),
        }
        for f in parsed_files
    ]

    count = index_repo(repo_id, files_data)

    return {
        "indexed": True,
        "symbol_count": count,
        "message": f"Indexed {count} symbols from {len(files_data)} files.",
    }


@router.get("/{repo_id}/index/stats")
async def index_stats(
    repo_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return whether this repo is indexed and how many symbols."""
    await _get_repo(repo_id, current_user, db)
    return get_index_stats(repo_id)


@router.post("/{repo_id}/search")
async def semantic_search(
    repo_id: int,
    body: SearchRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Search indexed symbols by natural language query.
    Returns ranked results with similarity scores.
    """
    await _get_repo(repo_id, current_user, db)

    if not body.query.strip():
        raise HTTPException(status_code=422, detail="query cannot be empty")

    results = search_repo(repo_id, body.query.strip(), n_results=body.n_results)
    return {"query": body.query, "results": results}


@router.post("/{repo_id}/ask")
async def ask_question(
    repo_id: int,
    body: RAGRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    RAG-powered Q&A. Ask any question about the codebase.
    Retrieves relevant symbols, then uses Groq to answer.
    """
    await _get_repo(repo_id, current_user, db)

    if not body.question.strip():
        raise HTTPException(status_code=422, detail="question cannot be empty")

    result = rag_query(repo_id, body.question.strip())
    return result