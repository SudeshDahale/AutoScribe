"""
Staleness detection system for identifying when code has changed but docs haven't.
Compares current file state against documented snapshots.
"""
import hashlib
import json
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.file_snapshot import FileSnapshot
from app.models.parsed_file import ParsedFile
from app.models.documentation import Documentation


def calculate_file_hash(content: str) -> str:
    """Calculate SHA256 hash of file content."""
    return hashlib.sha256(content.encode('utf-8')).hexdigest()


async def create_snapshot(
    db: AsyncSession,
    repo_id: int,
    file_path: str,
    content: str,
    symbols: list[dict],
    doc_type: str = "readme"
) -> FileSnapshot:
    """Create a snapshot of a file at the time of documentation."""
    content_hash = calculate_file_hash(content)
    
    # Check if snapshot exists
    result = await db.execute(
        select(FileSnapshot).where(
            FileSnapshot.repo_id == repo_id,
            FileSnapshot.file_path == file_path,
            FileSnapshot.doc_type == doc_type
        )
    )
    snapshot = result.scalar_one_or_none()
    
    if snapshot:
        # Update existing
        snapshot.content_hash = content_hash
        snapshot.symbols_snapshot = json.dumps(symbols)
        snapshot.documented_at = datetime.utcnow()
    else:
        # Create new
        snapshot = FileSnapshot(
            repo_id=repo_id,
            file_path=file_path,
            content_hash=content_hash,
            symbols_snapshot=json.dumps(symbols),
            doc_type=doc_type
        )
        db.add(snapshot)
    
    await db.commit()
    return snapshot


async def detect_stale_files(db: AsyncSession, repo_id: int) -> list[dict]:
    """
    Detect files where code has changed but docs haven't been updated.
    Returns list of stale files with details.
    """
    stale_files = []
    
    # Get all snapshots for this repo
    result = await db.execute(
        select(FileSnapshot).where(FileSnapshot.repo_id == repo_id)
    )
    snapshots = result.scalars().all()
    
    # Get current parsed files
    result = await db.execute(
        select(ParsedFile).where(ParsedFile.repo_id == repo_id)
    )
    current_files = {pf.file_path: pf for pf in result.scalars().all()}
    
    for snapshot in snapshots:
        file_path = snapshot.file_path
        
        # Check if file still exists
        if file_path not in current_files:
            stale_files.append({
                "file_path": file_path,
                "status": "deleted",
                "documented_at": snapshot.documented_at.isoformat(),
                "reason": "File no longer exists in repository"
            })
            continue
        
        current_file = current_files[file_path]
        
        # Compare symbols (structural changes)
        current_symbols = json.loads(current_file.symbols)
        snapshot_symbols = json.loads(snapshot.symbols_snapshot)
        
        symbols_changed = _compare_symbols(current_symbols, snapshot_symbols)
        
        if symbols_changed:
            stale_files.append({
                "file_path": file_path,
                "status": "modified",
                "documented_at": snapshot.documented_at.isoformat(),
                "parsed_at": current_file.parsed_at.isoformat(),
                "reason": "Code structure changed",
                "changes": symbols_changed
            })
    
    # Check for new files (exist in current but not in snapshots)
    snapshot_paths = {s.file_path for s in snapshots}
    for file_path, pf in current_files.items():
        if file_path not in snapshot_paths:
            stale_files.append({
                "file_path": file_path,
                "status": "new",
                "parsed_at": pf.parsed_at.isoformat(),
                "reason": "New file not yet documented"
            })
    
    return stale_files


def _compare_symbols(current: list[dict], snapshot: list[dict]) -> dict | None:
    """
    Compare two symbol lists and return changes if any.
    Returns None if identical, or dict with added/removed/modified symbols.
    """
    current_map = {f"{s['type']}:{s['name']}": s for s in current}
    snapshot_map = {f"{s['type']}:{s['name']}": s for s in snapshot}
    
    current_keys = set(current_map.keys())
    snapshot_keys = set(snapshot_map.keys())
    
    added = list(current_keys - snapshot_keys)
    removed = list(snapshot_keys - current_keys)
    
    # Check for signature changes in common symbols
    modified = []
    for key in current_keys & snapshot_keys:
        curr_sym = current_map[key]
        snap_sym = snapshot_map[key]
        
        # Compare signatures if available
        if curr_sym.get('signature') != snap_sym.get('signature'):
            modified.append(key)
    
    if added or removed or modified:
        return {
            "added": added,
            "removed": removed,
            "modified": modified
        }
    
    return None


async def get_staleness_report(db: AsyncSession, repo_id: int) -> dict:
    """
    Generate a comprehensive staleness report for a repository.
    """
    stale_files = await detect_stale_files(db, repo_id)
    
    # Get last documentation update
    result = await db.execute(
        select(Documentation)
        .where(Documentation.repo_id == repo_id)
        .order_by(Documentation.updated_at.desc())
    )
    last_doc = result.scalars().first()
    
    return {
        "repo_id": repo_id,
        "last_documented_at": last_doc.updated_at.isoformat() if last_doc else None,
        "stale_files_count": len(stale_files),
        "stale_files": stale_files,
        "status": "stale" if stale_files else "up_to_date",
        "breakdown": {
            "new": len([f for f in stale_files if f["status"] == "new"]),
            "modified": len([f for f in stale_files if f["status"] == "modified"]),
            "deleted": len([f for f in stale_files if f["status"] == "deleted"])
        }
    }