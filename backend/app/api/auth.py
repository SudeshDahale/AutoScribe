from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
import httpx

from app.core.config import settings

router = APIRouter()

GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"


@router.get("/github/login")
async def github_login():
    """Redirect user to GitHub OAuth."""
    params = f"client_id={settings.GITHUB_CLIENT_ID}&scope=repo,user:email"
    return RedirectResponse(f"{GITHUB_AUTHORIZE_URL}?{params}")


@router.get("/github/callback")
async def github_callback(code: str):
    """Handle GitHub OAuth callback."""
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

    return {"access_token": token_data["access_token"], "token_type": "bearer"}