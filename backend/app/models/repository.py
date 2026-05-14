from sqlalchemy import String, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class Repository(Base):
    __tablename__ = "repositories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)

    # identity
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)   # "owner/repo"
    repo_name: Mapped[str] = mapped_column(String(255), nullable=False)   # just "repo"
    github_url: Mapped[str] = mapped_column(String(500), nullable=False)

    # metadata fetched from GitHub
    description: Mapped[str] = mapped_column(String(1000), default="")
    default_branch: Mapped[str] = mapped_column(String(100), default="main")
    stars: Mapped[int] = mapped_column(Integer, default=0)
    language: Mapped[str] = mapped_column(String(100), default="")
    last_pushed_at: Mapped[str] = mapped_column(String(50), default="")   # ISO string from GH

    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())