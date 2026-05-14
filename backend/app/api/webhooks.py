"""
GitHub webhook handler for auto-triggering documentation updates on push.
"""
import hashlib
import hmac
import json
from fastapi import APIRouter, Request, HTTPException, Depends, Header, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.core.database import get_db
from app.models.webhook_config import WebhookConfig
from app.models.repository import Repository
from app.models.user import User
from app.core.incremental_updater import incremental_update_readme, incremental_update_docstrings

router = APIRouter()


def verify_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
    """Verify GitHub webhook HMAC signature."""
    if not signature:
        return False
    
    # GitHub sends signature as 'sha256=<hash>'
    expected_signature = "sha256=" + hmac.new(
        secret.encode('utf-8'),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected_signature, signature)


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    token = authorization.removeprefix("Bearer ").strip()
    result = await db.execute(select(User).where(User.access_token == token))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.post("/github")
async def handle_github_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    x_hub_signature_256: Optional[str] = Header(None),
    x_github_event: Optional[str] = Header(None),
):
    """
    Handle incoming GitHub webhook events.
    Triggers incremental doc updates when code is pushed.
    """
    payload = await request.body()
    
    try:
        data = json.loads(payload)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
    
    # Extract repository info
    if "repository" not in data:
        raise HTTPException(status_code=400, detail="No repository in payload")
    
    repo_full_name = data["repository"]["full_name"]
    
    # Find webhook config
    result = await db.execute(
        select(Repository).where(Repository.full_name == repo_full_name)
    )
    repo = result.scalar_one_or_none()
    
    if not repo:
        # Repository not tracked - ignore silently
        return {"status": "ignored", "reason": "repository not tracked"}
    
    result = await db.execute(
        select(WebhookConfig).where(WebhookConfig.repo_id == repo.id)
    )
    webhook_config = result.scalar_one_or_none()
    
    if not webhook_config or not webhook_config.enabled:
        return {"status": "ignored", "reason": "webhook not configured or disabled"}
    
    # Verify signature
    if not verify_webhook_signature(payload, x_hub_signature_256 or "", webhook_config.webhook_secret):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")
    
    # Handle push events
    if x_github_event == "push":
        # Extract changed files from commits
        changed_files = set()
        for commit in data.get("commits", []):
            changed_files.update(commit.get("added", []))
            changed_files.update(commit.get("modified", []))
        
        # Filter to only code files we care about
        code_extensions = {".py", ".js", ".jsx", ".ts", ".tsx"}
        changed_code_files = [
            f for f in changed_files
            if any(f.endswith(ext) for ext in code_extensions)
        ]
        
        if webhook_config.auto_regenerate and changed_code_files:
            # Trigger incremental update in background
            background_tasks.add_task(
                trigger_background_update,
                db,
                repo.id,
                list(changed_code_files)
            )
            
            return {
                "status": "processing",
                "message": f"Triggered update for {len(changed_code_files)} file(s)",
                "files": changed_code_files
            }
    
    return {"status": "ok", "event": x_github_event}


async def trigger_background_update(db: AsyncSession, repo_id: int, file_paths: list[str]):
    """Background task to update documentation after webhook trigger."""
    try:
        # Update docstrings for changed files
        await incremental_update_docstrings(db, repo_id, file_paths)
        
        # Update README
        await incremental_update_readme(db, repo_id, force_full=False)
        
        print(f"✅ Webhook-triggered update completed for repo {repo_id}")
    except Exception as e:
        print(f"❌ Webhook update failed for repo {repo_id}: {e}")


@router.post("/{repo_id}/configure-webhook")
async def configure_webhook(
    repo_id: int,
    body: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Configure GitHub webhook for a repository.
    
    Body:
    - enabled: bool
    - auto_regenerate: bool
    - webhook_secret: str (for HMAC verification)
    """
    # Verify ownership
    result = await db.execute(
        select(Repository).where(
            Repository.id == repo_id,
            Repository.user_id == current_user.id
        )
    )
    repo = result.scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    # Get or create webhook config
    result = await db.execute(
        select(WebhookConfig).where(WebhookConfig.repo_id == repo_id)
    )
    config = result.scalar_one_or_none()
    
    if config:
        config.enabled = body.get("enabled", config.enabled)
        config.auto_regenerate = body.get("auto_regenerate", config.auto_regenerate)
        if "webhook_secret" in body:
            config.webhook_secret = body["webhook_secret"]
    else:
        config = WebhookConfig(
            repo_id=repo_id,
            enabled=body.get("enabled", True),
            auto_regenerate=body.get("auto_regenerate", True),
            webhook_secret=body.get("webhook_secret", "")
        )
        db.add(config)
    
    await db.commit()
    
    webhook_url = f"https://your-domain.com/api/v1/webhooks/github"
    
    return {
        "success": True,
        "webhook_url": webhook_url,
        "config": {
            "enabled": config.enabled,
            "auto_regenerate": config.auto_regenerate,
            "webhook_secret_set": bool(config.webhook_secret)
        },
        "instructions": {
            "step_1": f"Go to https://github.com/{repo.full_name}/settings/hooks",
            "step_2": f"Add webhook with URL: {webhook_url}",
            "step_3": "Set content type to application/json",
            "step_4": f"Set secret to: {config.webhook_secret}",
            "step_5": "Select 'Just the push event'"
        }
    }


@router.get("/{repo_id}/webhook-status")
async def get_webhook_status(
    repo_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get webhook configuration status for a repository."""
    # Verify ownership
    result = await db.execute(
        select(Repository).where(
            Repository.id == repo_id,
            Repository.user_id == current_user.id
        )
    )
    repo = result.scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    result = await db.execute(
        select(WebhookConfig).where(WebhookConfig.repo_id == repo_id)
    )
    config = result.scalar_one_or_none()
    
    if not config:
        return {"configured": False}
    
    return {
        "configured": True,
        "enabled": config.enabled,
        "auto_regenerate": config.auto_regenerate,
        "last_triggered_at": config.last_triggered_at.isoformat() if config.last_triggered_at else None
    }