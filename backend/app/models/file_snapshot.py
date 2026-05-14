from sqlalchemy import String, Integer, ForeignKey, Text, func, DateTime, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class FileSnapshot(Base):
    """
    Tracks the state of each file at the time documentation was generated.
    Used to detect staleness when code changes but docs haven't been updated.
    """
    __tablename__ = "file_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    repo_id: Mapped[int] = mapped_column(Integer, ForeignKey("repositories.id"), nullable=False)
    file_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    
    # Content hash to detect changes
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False)  # SHA256
    
    # Last time this file was documented
    documented_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())
    
    # Store the symbols at time of documentation for comparison
    symbols_snapshot: Mapped[str] = mapped_column(Text, default="[]")  # JSON
    
    # Track which documentation was generated from this snapshot
    doc_type: Mapped[str] = mapped_column(String(50), default="readme")  # readme, docstrings
    
    __table_args__ = (
        Index('idx_repo_file_path', 'repo_id', 'file_path'),
    )