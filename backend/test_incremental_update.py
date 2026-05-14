"""
Test script for incremental documentation updates
"""
import asyncio
import sys
from pathlib import Path

# Ensure we can import app modules
sys.path.insert(0, str(Path(__file__).parent))

# Import all models first to ensure SQLAlchemy knows about them
from app.models.user import User
from app.models.repository import Repository
from app.models.analysis_job import AnalysisJob
from app.models.documentation import Documentation
from app.models.parsed_file import ParsedFile
from app.models.file_snapshot import FileSnapshot
from app.models.webhook_config import WebhookConfig

from app.core.database import get_db
from app.core.staleness_detector import get_staleness_report
from app.core.incremental_updater import incremental_update_docstrings, incremental_update_readme


async def test_incremental_update():
    async for db in get_db():
        repo_id = 1  # Adjust as needed
        
        print("=" * 60)
        print("📊 BEFORE UPDATE - Staleness Report")
        print("=" * 60)
        report = await get_staleness_report(db, repo_id)
        print(f"Status: {report['status']}")
        print(f"Stale files: {report['stale_files_count']}")
        print(f"Breakdown: New={report['breakdown']['new']}, Modified={report['breakdown']['modified']}, Deleted={report['breakdown']['deleted']}")
        
        print("\n" + "=" * 60)
        print("🔄 RUNNING INCREMENTAL UPDATE")
        print("=" * 60)
        
        # Update docstrings for first 5 stale files
        stale_files = [f['file_path'] for f in report['stale_files'][:5]]
        print(f"\nUpdating docstrings for {len(stale_files)} files:")
        for fp in stale_files:
            print(f"  • {fp}")
        
        result = await incremental_update_docstrings(db, repo_id, stale_files)
        print(f"\n✅ Docstrings updated: {result['updated_count']} files")
        
        # Update README
        print("\n🔄 Updating README...")
        readme_result = await incremental_update_readme(db, repo_id, force_full=True)
        print(f"✅ README: {readme_result['message']}")
        
        print("\n" + "=" * 60)
        print("📊 AFTER UPDATE - Staleness Report")
        print("=" * 60)
        report_after = await get_staleness_report(db, repo_id)
        print(f"Status: {report_after['status']}")
        print(f"Stale files: {report_after['stale_files_count']}")
        print(f"Breakdown: New={report_after['breakdown']['new']}, Modified={report_after['breakdown']['modified']}, Deleted={report_after['breakdown']['deleted']}")
        
        print("\n" + "=" * 60)
        print("📈 SUMMARY")
        print("=" * 60)
        print(f"Files reduced from {report['stale_files_count']} → {report_after['stale_files_count']}")
        print(f"Documentation snapshots created: {len(stale_files)}")
        

if __name__ == "__main__":
    asyncio.run(test_incremental_update())