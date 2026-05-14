"""
Test script for staleness detection
"""
import asyncio
import sys
from pathlib import Path

# Ensure we can import app modules
sys.path.insert(0, str(Path(__file__).parent))

# Import all models first
from app.models.user import User
from app.models.repository import Repository
from app.models.analysis_job import AnalysisJob
from app.models.documentation import Documentation
from app.models.parsed_file import ParsedFile
from app.models.file_snapshot import FileSnapshot
from app.models.webhook_config import WebhookConfig

from app.core.database import get_db
from app.core.staleness_detector import get_staleness_report


async def test_staleness():
    async for db in get_db():
        # Test with repo_id = 1 (adjust as needed)
        report = await get_staleness_report(db, repo_id=1)
        
        print("📊 Staleness Report")
        print(f"Status: {report['status']}")
        print(f"Stale files: {report['stale_files_count']}")
        print(f"\nBreakdown:")
        print(f"  - New: {report['breakdown']['new']}")
        print(f"  - Modified: {report['breakdown']['modified']}")
        print(f"  - Deleted: {report['breakdown']['deleted']}")
        
        if report['stale_files']:
            print(f"\nStale Files:")
            for file in report['stale_files'][:5]:  # Show first 5
                print(f"  • {file['file_path']} - {file['status']}: {file['reason']}")


if __name__ == "__main__":
    asyncio.run(test_staleness())