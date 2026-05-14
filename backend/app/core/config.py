from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./autoscribe.db"
    REDIS_URL: str = "redis://localhost:6379/0"
    SECRET_KEY: str = "local-dev-secret-change-me"
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""
    GITHUB_WEBHOOK_SECRET: str = ""
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    GROQ_API_KEY: str = ""

    class Config:
        env_file = ".env"


settings = Settings()