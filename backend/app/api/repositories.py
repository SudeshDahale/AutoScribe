from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.core.database import get_db
from app.models.repository import Repository

router = APIRouter()


class RepoCreate(BaseModel):
    repo_name: str
    github_url: str
    default_branch: str = "main"


@router.get("/")
async def list_repositories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Repository))
    repos = result.scalars().all()
    return repos


@router.post("/")
async def add_repository(payload: RepoCreate, db: AsyncSession = Depends(get_db)):
    repo = Repository(
        user_id=1,  # placeholder until auth is wired up in Sprint 1
        repo_name=payload.repo_name,
        github_url=payload.github_url,
        default_branch=payload.default_branch,
    )
    db.add(repo)
    await db.commit()
    await db.refresh(repo)
    return repo