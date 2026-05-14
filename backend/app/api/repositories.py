from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
import httpx
import re

from app.core.database import get_db
from app.models.repository import Repository
from app.models.user import User

router = APIRouter()


# ── helpers ──────────────────────────────────────────────────────────────────

async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Resolve the GitHub access token in the Authorization header to a DB user."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = authorization.removeprefix("Bearer ").strip()
    result = await db.execute(select(User).where(User.access_token == token))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found for this token")
    return user


def parse_owner_repo(url_or_name: str) -> tuple[str, str]:
    """
    Accept any of:
      - https://github.com/owner/repo
      - github.com/owner/repo
      - owner/repo
    Returns (owner, repo_name).
    """
    # strip trailing .git
    cleaned = url_or_name.strip().rstrip("/").removesuffix(".git")
    # grab the last two path segments
    match = re.search(r"([A-Za-z0-9_.-]+)/([A-Za-z0-9_.-]+)$", cleaned)
    if not match:
        raise HTTPException(
            status_code=422,
            detail="Could not parse repo. Use 'owner/repo' or a full GitHub URL.",
        )
    return match.group(1), match.group(2)


async def fetch_github_repo(owner: str, repo: str, token: str) -> dict:
    """Call the GitHub API and return the repo JSON."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}",
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github+json",
            },
        )
    if resp.status_code == 404:
        raise HTTPException(status_code=404, detail=f"GitHub repo '{owner}/{repo}' not found or not accessible")
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail="GitHub API error")
    return resp.json()


# ── schemas ───────────────────────────────────────────────────────────────────

class RepoAdd(BaseModel):
    repo_url: str   # owner/repo  OR  full https://github.com/owner/repo


# ── routes ───────────────────────────────────────────────────────────────────

@router.get("/")
async def list_repositories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Repository).where(Repository.user_id == current_user.id)
    )
    repos = result.scalars().all()
    return repos


@router.post("/", status_code=201)
async def add_repository(
    payload: RepoAdd,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    owner, repo_name = parse_owner_repo(payload.repo_url)
    full_name = f"{owner}/{repo_name}"

    # prevent duplicates per user
    existing = await db.execute(
        select(Repository).where(
            Repository.user_id == current_user.id,
            Repository.full_name == full_name,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Repository already added")

    gh = await fetch_github_repo(owner, repo_name, current_user.access_token)

    repo = Repository(
        user_id=current_user.id,
        full_name=full_name,
        repo_name=gh["name"],
        github_url=gh["html_url"],
        description=gh.get("description") or "",
        default_branch=gh.get("default_branch", "main"),
        stars=gh.get("stargazers_count", 0),
        language=gh.get("language") or "",
        last_pushed_at=gh.get("pushed_at") or "",
    )
    db.add(repo)
    await db.commit()
    await db.refresh(repo)
    return repo


@router.delete("/{repo_id}", status_code=204)
async def delete_repository(
    repo_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Repository).where(
            Repository.id == repo_id,
            Repository.user_id == current_user.id,
        )
    )
    repo = result.scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    await db.delete(repo)
    await db.commit()