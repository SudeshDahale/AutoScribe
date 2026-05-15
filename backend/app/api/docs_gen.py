import json
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.core.database import get_db
from app.core.doc_generator import generate_readme, generate_file_docstrings
from app.models.user import User
from app.models.repository import Repository
from app.models.parsed_file import ParsedFile
from app.models.documentation import Documentation

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


@router.post("/{repo_id}/generate-readme")
async def generate_repo_readme(
    repo_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # verify ownership
    result = await db.execute(
        select(Repository).where(Repository.id == repo_id, Repository.user_id == current_user.id)
    )
    repo = result.scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    # get parsed files
    result = await db.execute(select(ParsedFile).where(ParsedFile.repo_id == repo_id))
    parsed_files = result.scalars().all()
    if not parsed_files:
        raise HTTPException(status_code=400, detail="Parse the repository first before generating docs")

    files_data = [
        {"file_path": f.file_path, "language": f.language, "symbols": json.loads(f.symbols)}
        for f in parsed_files
    ]

    readme_content = generate_readme(repo.full_name, files_data)

    # save to documentation table
    existing = await db.execute(
        select(Documentation).where(Documentation.repo_id == repo_id, Documentation.doc_type == "readme")
    )
    doc = existing.scalar_one_or_none()
    if doc:
        doc.content = readme_content
    else:
        doc = Documentation(repo_id=repo_id, doc_type="readme", content=readme_content)
        db.add(doc)

    await db.commit()
    return {"content": readme_content}


@router.get("/{repo_id}/generate-readme")
async def get_repo_readme(
    repo_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Repository).where(Repository.id == repo_id, Repository.user_id == current_user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Repository not found")

    result = await db.execute(
        select(Documentation).where(Documentation.repo_id == repo_id, Documentation.doc_type == "readme")
    )
    doc = result.scalar_one_or_none()
    if not doc:
        return {"content": None}
    return {"content": doc.content}


@router.post("/{repo_id}/generate-docstrings")
async def generate_docstrings_for_file(
    repo_id: int,
    body: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate docstrings for a specific file in the repo."""
    file_path = body.get("file_path")
    if not file_path:
        raise HTTPException(status_code=422, detail="file_path required")

    result = await db.execute(
        select(Repository).where(Repository.id == repo_id, Repository.user_id == current_user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Repository not found")

    result = await db.execute(
        select(ParsedFile).where(ParsedFile.repo_id == repo_id, ParsedFile.file_path == file_path)
    )
    pf = result.scalar_one_or_none()
    if not pf:
        raise HTTPException(status_code=404, detail="File not found in parse results")

    symbols = json.loads(pf.symbols)
    docstrings_json = generate_file_docstrings(pf.file_path, pf.language, symbols)

    # save to documentation table keyed by file path
    doc_type = f"docstrings:{file_path}"
    existing = await db.execute(
        select(Documentation).where(Documentation.repo_id == repo_id, Documentation.doc_type == doc_type)
    )
    doc = existing.scalar_one_or_none()
    if doc:
        doc.content = docstrings_json
    else:
        doc = Documentation(repo_id=repo_id, doc_type=doc_type, content=docstrings_json)
        db.add(doc)

    await db.commit()
    return {"docstrings": json.loads(docstrings_json)}

@router.get("/{repo_id}/analytics")
async def get_repo_analytics(
    repo_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns doc coverage %, staleness breakdown, and symbol counts
    for the Analytics dashboard panel.
    """
    from app.models.file_snapshot import FileSnapshot
    from app.core.staleness_detector import get_staleness_report

    result = await db.execute(
        select(Repository).where(Repository.id == repo_id, Repository.user_id == current_user.id)
    )
    repo = result.scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    # Parsed files
    result = await db.execute(select(ParsedFile).where(ParsedFile.repo_id == repo_id))
    parsed_files = result.scalars().all()

    total_files = len(parsed_files)
    total_symbols = sum(len(json.loads(f.symbols)) for f in parsed_files)
    documented_symbols = sum(
        len([s for s in json.loads(f.symbols) if s.get("docstring")])
        for f in parsed_files
    )

    # Documentation records
    result = await db.execute(
        select(Documentation).where(Documentation.repo_id == repo_id)
    )
    docs = result.scalars().all()
    has_readme = any(d.doc_type == "readme" for d in docs)
    docstring_files = [d for d in docs if d.doc_type.startswith("docstrings:")]

    # Staleness
    staleness = await get_staleness_report(db, repo_id)

    coverage_pct = round((documented_symbols / total_symbols * 100) if total_symbols > 0 else 0, 1)

    return {
        "repo_id": repo_id,
        "total_files": total_files,
        "total_symbols": total_symbols,
        "documented_symbols": documented_symbols,
        "coverage_pct": coverage_pct,
        "has_readme": has_readme,
        "docstring_files_count": len(docstring_files),
        "stale_count": staleness["stale_files_count"],
        "stale_breakdown": staleness["breakdown"],
        "last_documented_at": staleness["last_documented_at"],
        "status": staleness["status"],
    }