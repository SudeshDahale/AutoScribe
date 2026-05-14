import json
import shutil
import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import Optional

from app.core.database import get_db
from app.core.parser import parse_repo
from app.core.github_fetch import fetch_repo_files
from app.models.user import User
from app.models.repository import Repository
from app.models.parsed_file import ParsedFile

router = APIRouter()


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


@router.post("/{repo_id}/parse")
async def parse_repository(
    repo_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # verify repo belongs to user
    result = await db.execute(
        select(Repository).where(
            Repository.id == repo_id,
            Repository.user_id == current_user.id,
        )
    )
    repo = result.scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    owner, repo_name = repo.full_name.split("/", 1)

    # download source files into a temp dir
    tmp = Path(tempfile.mkdtemp())
    try:
        await fetch_repo_files(
            owner, repo_name, repo.default_branch, current_user.access_token, tmp
        )

        # parse
        parsed = parse_repo(tmp)

        # clear old results for this repo
        await db.execute(delete(ParsedFile).where(ParsedFile.repo_id == repo_id))

        # store new results
        for item in parsed:
            pf = ParsedFile(
                repo_id=repo_id,
                file_path=item["file_path"],
                language=item["language"],
                symbols=json.dumps(item["symbols"]),
            )
            db.add(pf)

        await db.commit()
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    return {"parsed_files": len(parsed), "repo_id": repo_id}


@router.get("/{repo_id}/parse")
async def get_parse_results(
    repo_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # verify ownership
    result = await db.execute(
        select(Repository).where(
            Repository.id == repo_id,
            Repository.user_id == current_user.id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Repository not found")

    result = await db.execute(
        select(ParsedFile).where(ParsedFile.repo_id == repo_id)
    )
    files = result.scalars().all()

    return [
        {
            "file_path": f.file_path,
            "language": f.language,
            "symbols": json.loads(f.symbols),
            "parsed_at": f.parsed_at,
        }
        for f in files
    ]