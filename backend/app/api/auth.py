from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User

router = APIRouter()

GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"


@router.get("/github/login")
async def github_login():
    params = f"client_id={settings.GITHUB_CLIENT_ID}&scope=repo,user:email"
    return RedirectResponse(f"{GITHUB_AUTHORIZE_URL}?{params}")


@router.get("/github/callback")
async def github_callback(code: str, db: AsyncSession = Depends(get_db)):
    # Exchange code for token
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            GITHUB_TOKEN_URL,
            headers={"Accept": "application/json"},
            data={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code,
            },
        )
        token_data = token_resp.json()

    if "access_token" not in token_data:
        raise HTTPException(status_code=400, detail="GitHub OAuth failed")

    access_token = token_data["access_token"]

    # Fetch GitHub user profile
    async with httpx.AsyncClient() as client:
        user_resp = await client.get(
            GITHUB_USER_URL,
            headers={"Authorization": f"Bearer {access_token}"}
        )
        github_user = user_resp.json()

    # Check if user already exists
    result = await db.execute(
        select(User).where(User.github_id == github_user["id"])
    )
    user = result.scalar_one_or_none()

    if user:
        # Update token
        user.access_token = access_token
    else:
        # Create new user
        user = User(
            github_id=github_user["id"],
            username=github_user["login"],
            email=github_user.get("email"),
            avatar_url=github_user.get("avatar_url"),
            access_token=access_token,
        )
        db.add(user)

    await db.commit()
    await db.refresh(user)

    return {
        "access_token": access_token,
        "username": user.username,
        "avatar_url": user.avatar_url,
        "user_id": user.id
    }