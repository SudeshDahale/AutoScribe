"""
API endpoints for staleness detection and incremental updates.
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.core.database import get_db
from app.core.staleness_detector import get_staleness_report
from app.core.incremental_updater import incremental_update_docstrings, incremental_update_readme
from app.models.user import User
from app.models.repository import Repository

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


@router.get("/{repo_id}/staleness")
async def check_staleness(
    repo_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Check if documentation is stale (code changed but docs haven't been updated).
    Returns a detailed report of all stale files.
    """
    # Verify ownership
    result = await db.execute(
        select(Repository).where(
            Repository.id == repo_id,
            Repository.user_id == current_user.id
        )
    )
    repo = result.scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    report = await get_staleness_report(db, repo_id)
    return report


@router.post("/{repo_id}/update-incremental")
async def trigger_incremental_update(
    repo_id: int,
    body: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Trigger incremental documentation update.
    Only regenerates docs for changed files.
    
    Body:
    - update_type: "docstrings" | "readme" | "all"
    - file_paths: optional list of specific files to update (auto-detects if omitted)
    - force_full: optional bool to force full regeneration
    """
    # Verify ownership
    result = await db.execute(
        select(Repository).where(
            Repository.id == repo_id,
            Repository.user_id == current_user.id
        )
    )
    repo = result.scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    update_type = body.get("update_type", "all")
    file_paths = body.get("file_paths")
    force_full = body.get("force_full", False)
    
    results = {}
    
    if update_type in ["docstrings", "all"]:
        docstrings_result = await incremental_update_docstrings(db, repo_id, file_paths)
        results["docstrings"] = docstrings_result
    
    if update_type in ["readme", "all"]:
        readme_result = await incremental_update_readme(db, repo_id, force_full)
        results["readme"] = readme_result
    
    return {
        "success": True,
        "results": results
    }