"""
Migration script to add staleness detection tables.
Run this to update your existing database.
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path so we can import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import engine, Base

# Import ALL models so SQLAlchemy knows about them
from app.models.user import User
from app.models.repository import Repository
from app.models.analysis_job import AnalysisJob
from app.models.documentation import Documentation
from app.models.parsed_file import ParsedFile
from app.models.file_snapshot import FileSnapshot
from app.models.webhook_config import WebhookConfig


async def migrate():
    print("🔄 Starting migration...")
    print("📦 Models loaded:")
    print(f"  - User")
    print(f"  - Repository")
    print(f"  - AnalysisJob")
    print(f"  - Documentation")
    print(f"  - ParsedFile")
    print(f"  - FileSnapshot (NEW)")
    print(f"  - WebhookConfig (NEW)")
    
    async with engine.begin() as conn:
        # Create all tables (will only create missing ones)
        await conn.run_sync(Base.metadata.create_all)
    
    print("✅ Migration complete - database schema updated")
    print("📊 New tables added:")
    print("  - file_snapshots")
    print("  - webhook_configs")


if __name__ == "__main__":
    asyncio.run(migrate())