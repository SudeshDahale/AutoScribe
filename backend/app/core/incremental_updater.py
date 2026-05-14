"""
Incremental documentation updates.
Re-generates only changed sections instead of full regeneration.
"""
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.parsed_file import ParsedFile
from app.models.documentation import Documentation
from app.core.doc_generator import generate_file_docstrings, generate_readme
from app.core.staleness_detector import create_snapshot, detect_stale_files


async def incremental_update_docstrings(
    db: AsyncSession,
    repo_id: int,
    file_paths: list[str] | None = None
) -> dict:
    """
    Update docstrings only for changed files.
    If file_paths is None, updates all stale files.
    """
    if file_paths is None:
        # Auto-detect stale files
        stale_files = await detect_stale_files(db, repo_id)
        file_paths = [f["file_path"] for f in stale_files if f["status"] in ["new", "modified"]]
    
    if not file_paths:
        return {"updated_count": 0, "message": "No files to update"}
    
    updated_files = []
    
    for file_path in file_paths:
        # Get parsed file
        result = await db.execute(
            select(ParsedFile).where(
                ParsedFile.repo_id == repo_id,
                ParsedFile.file_path == file_path
            )
        )
        pf = result.scalar_one_or_none()
        
        if not pf:
            continue
        
        # Generate new docstrings
        symbols = json.loads(pf.symbols)
        docstrings_json = generate_file_docstrings(pf.file_path, pf.language, symbols)
        
        # Update documentation
        doc_type = f"docstrings:{file_path}"
        result = await db.execute(
            select(Documentation).where(
                Documentation.repo_id == repo_id,
                Documentation.doc_type == doc_type
            )
        )
        doc = result.scalar_one_or_none()
        
        if doc:
            doc.content = docstrings_json
        else:
            doc = Documentation(
                repo_id=repo_id,
                doc_type=doc_type,
                content=docstrings_json
            )
            db.add(doc)
        
        # Create snapshot (we don't have actual file content here, so use symbols as proxy)
        # In a real implementation, you'd fetch the file content
        content_proxy = json.dumps(symbols)
        await create_snapshot(db, repo_id, file_path, content_proxy, symbols, "docstrings")
        
        updated_files.append(file_path)
    
    await db.commit()
    
    return {
        "updated_count": len(updated_files),
        "updated_files": updated_files,
        "message": f"Successfully updated {len(updated_files)} file(s)"
    }


async def incremental_update_readme(
    db: AsyncSession,
    repo_id: int,
    force_full: bool = False
) -> dict:
    """
    Update README intelligently:
    - If major changes detected, regenerate full README
    - If minor changes, update only affected sections
    """
    stale_files = await detect_stale_files(db, repo_id)
    
    if not stale_files and not force_full:
        return {"updated": False, "message": "README is up to date"}
    
    # Get all parsed files
    result = await db.execute(select(ParsedFile).where(ParsedFile.repo_id == repo_id))
    parsed_files = result.scalars().all()
    
    files_data = [
        {"file_path": f.file_path, "language": f.language, "symbols": json.loads(f.symbols)}
        for f in parsed_files
    ]
    
    # For now, always regenerate full README
    # TODO: Implement smart section-based updates
    from app.models.repository import Repository
    result = await db.execute(select(Repository).where(Repository.id == repo_id))
    repo = result.scalar_one_or_none()
    
    if not repo:
        return {"updated": False, "message": "Repository not found"}
    
    readme_content = generate_readme(repo.full_name, files_data)
    
    # Update documentation
    result = await db.execute(
        select(Documentation).where(
            Documentation.repo_id == repo_id,
            Documentation.doc_type == "readme"
        )
    )
    doc = result.scalar_one_or_none()
    
    if doc:
        doc.content = readme_content
    else:
        doc = Documentation(
            repo_id=repo_id,
            doc_type="readme",
            content=readme_content
        )
        db.add(doc)
    
    # Create snapshots for all files
    for pf in parsed_files:
        symbols = json.loads(pf.symbols)
        content_proxy = json.dumps(symbols)
        await create_snapshot(db, repo_id, pf.file_path, content_proxy, symbols, "readme")
    
    await db.commit()
    
    return {
        "updated": True,
        "message": "README regenerated successfully",
        "stale_files_addressed": len(stale_files)
    }