from sqlalchemy import String, Integer, ForeignKey, Boolean, func, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class WebhookConfig(Base):
    """
    GitHub webhook configuration for auto-triggering doc updates on push.
    """
    __tablename__ = "webhook_configs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    repo_id: Mapped[int] = mapped_column(Integer, ForeignKey("repositories.id"), nullable=False, unique=True)
    
    # GitHub webhook details
    webhook_id: Mapped[str] = mapped_column(String(100), nullable=True)  # GitHub webhook ID
    webhook_secret: Mapped[str] = mapped_column(String(100), nullable=False)  # For HMAC verification
    
    # Settings
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    auto_regenerate: Mapped[bool] = mapped_column(Boolean, default=True)  # Auto-regenerate docs on push
    
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())
    last_triggered_at: Mapped[DateTime | None] = mapped_column(DateTime, nullable=True)