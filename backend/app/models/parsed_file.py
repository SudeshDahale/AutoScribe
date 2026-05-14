from sqlalchemy import String, Integer, ForeignKey, Text, func, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class ParsedFile(Base):
    __tablename__ = "parsed_files"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    repo_id: Mapped[int] = mapped_column(Integer, ForeignKey("repositories.id"), nullable=False)
    file_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    language: Mapped[str] = mapped_column(String(50), nullable=False)
    symbols: Mapped[str] = mapped_column(Text, default="[]")  # JSON list of extracted symbols
    parsed_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())