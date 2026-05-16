"""
AutoScribe autonomous background scheduler.

Runs inside the FastAPI process — no Redis, no Celery needed.
Every POLL_INTERVAL_MINUTES it:
  1. Finds all repos with auto_regenerate=True
  2. Regenerates docs (README, docstrings for stale files)
  3. Pushes commits directly to the persistent 'autoscribe/docs' branch

Starts automatically when the FastAPI app starts.
"""
import json
import base64
import logging
from datetime import datetime, timezone

import httpx
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models.repository import Repository
from app.models.user import User
from app.models.parsed_file import ParsedFile
from app.models.documentation import Documentation
from app.models.webhook_config import WebhookConfig
from app.core.doc_generator import generate_readme, generate_file_docstrings
from app.core.staleness_detector import detect_stale_files

logger = logging.getLogger("autoscribe.scheduler")

# ── Config ────────────────────────────────────────────────────────────────────
POLL_INTERVAL_MINUTES = 60
AUTOSCRIBE_BRANCH     = "autoscribe/docs"
DOC_TYPE_TO_FILE = {
    "readme":       "README.md",
    "architecture": "docs/ARCHITECTURE.md",
    "api_docs":     "docs/API.md",
    "runbook":      "docs/RUNBOOK.md",
    "onboarding":   "docs/ONBOARDING.md",
}

# ── DB session factory (independent of request lifecycle) ─────────────────────
_engine = create_async_engine(settings.DATABASE_URL, echo=False)
_async_session = sessionmaker(_engine, class_=AsyncSession, expire_on_commit=False)

# ── Scheduler singleton ───────────────────────────────────────────────────────
scheduler = AsyncIOScheduler()


# ─────────────────────────────────────────────────────────────────────────────
# Style reference loader
# ─────────────────────────────────────────────────────────────────────────────

async def _load_style_reference(db: AsyncSession, repo_id: int, doc_type: str) -> str | None:
    """
    Load a saved style reference for (repo_id, doc_type) directly from an
    already-open DB session. Returns the raw reference text or None.
    Silently swallows errors so a missing reference never breaks generation.
    """
    try:
        result = await db.execute(
            select(Documentation).where(
                Documentation.repo_id == repo_id,
                Documentation.doc_type == f"style_reference:{doc_type}",
            )
        )
        doc = result.scalar_one_or_none()
        if doc:
            data = json.loads(doc.content)
            ref = data.get("reference_text", "").strip()
            if ref:
                logger.info(
                    "  🎨 Style reference found for repo %d / %s (%d chars)",
                    repo_id, doc_type, len(ref),
                )
                return ref
    except Exception as e:
        logger.warning("  ⚠️  Could not load style reference for %d/%s: %s", repo_id, doc_type, e)
    return None


# ─────────────────────────────────────────────────────────────────────────────
# GitHub helpers
# ─────────────────────────────────────────────────────────────────────────────

async def _gh_headers(token: str) -> dict:
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


async def _ensure_branch(client: httpx.AsyncClient, base_api: str, headers: dict,
                          default_branch: str) -> bool:
    """Create AUTOSCRIBE_BRANCH if it doesn't exist. Returns True on success."""
    r = await client.get(f"{base_api}/git/ref/heads/{default_branch}", headers=headers)
    if r.status_code != 200:
        logger.error("Could not get default branch ref: %s", r.text)
        return False
    sha = r.json()["object"]["sha"]

    r = await client.post(
        f"{base_api}/git/refs",
        headers=headers,
        json={"ref": f"refs/heads/{AUTOSCRIBE_BRANCH}", "sha": sha},
    )
    # 422 = already exists, which is fine
    return r.status_code in (200, 201, 422)


async def _commit_file(client: httpx.AsyncClient, base_api: str, headers: dict,
                        file_path: str, content: str, commit_msg: str) -> bool:
    """Upsert a file on AUTOSCRIBE_BRANCH. Returns True on success."""
    file_sha = None
    r = await client.get(
        f"{base_api}/contents/{file_path}?ref={AUTOSCRIBE_BRANCH}", headers=headers
    )
    if r.status_code == 200:
        file_sha = r.json().get("sha")

    payload: dict = {
        "message": commit_msg,
        "content": base64.b64encode(content.encode()).decode(),
        "branch": AUTOSCRIBE_BRANCH,
    }
    if file_sha:
        payload["sha"] = file_sha

    r = await client.put(
        f"{base_api}/contents/{file_path}", headers=headers, json=payload
    )
    if r.status_code not in (200, 201):
        logger.error("Commit failed for %s: %s", file_path, r.text)
        return False
    return True


async def _upsert_pr(client: httpx.AsyncClient, base_api: str, headers: dict,
                      repo_full_name: str, default_branch: str) -> None:
    """Open a PR from AUTOSCRIBE_BRANCH if none exists yet; otherwise leave it open."""
    owner = repo_full_name.split("/")[0]
    r = await client.get(
        f"{base_api}/pulls",
        headers=headers,
        params={"state": "open", "head": f"{owner}:{AUTOSCRIBE_BRANCH}", "base": default_branch},
    )
    if r.status_code == 200 and r.json():
        return  # PR already open — nothing to do

    ts = datetime.now(timezone.utc).isoformat()
    await client.post(
        f"{base_api}/pulls",
        headers=headers,
        json={
            "title": "docs: AutoScribe — continuous documentation updates",
            "head": AUTOSCRIBE_BRANCH,
            "base": default_branch,
            "body": (
                "## 📝 AutoScribe — Continuous Documentation\n\n"
                "This PR is **automatically kept up to date** by AutoScribe.\n"
                "New commits are pushed here on every scheduled regeneration.\n\n"
                f"**Scheduler started:** {ts}\n\n"
                "---\n*Merge when ready. AutoScribe will keep this branch fresh.*"
            ),
        },
    )


# ─────────────────────────────────────────────────────────────────────────────
# Core update logic (per repo)
# ─────────────────────────────────────────────────────────────────────────────

async def _update_repo(db: AsyncSession, repo: Repository, user: User) -> None:
    """Run a full autonomous doc update cycle for one repository."""
    logger.info("🔄 Scheduler: updating repo %s", repo.full_name)
    ts = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    base_api = f"https://api.github.com/repos/{repo.full_name}"
    headers = await _gh_headers(user.access_token)

    # ── 1. Fetch parsed files ─────────────────────────────────────────────────
    result = await db.execute(select(ParsedFile).where(ParsedFile.repo_id == repo.id))
    parsed_files = result.scalars().all()
    if not parsed_files:
        logger.info("  ⏭  No parsed files for %s — skipping", repo.full_name)
        return

    files_data = [
        {"file_path": f.file_path, "language": f.language, "symbols": json.loads(f.symbols)}
        for f in parsed_files
    ]

    # ── 2. Detect stale files ─────────────────────────────────────────────────
    stale = await detect_stale_files(db, repo.id)
    stale_paths = {f["file_path"] for f in stale if f["status"] in ("new", "modified")}

    # ── 3. Load style references once — reused for every generation call ──────
    readme_style    = await _load_style_reference(db, repo.id, "readme")
    docstring_style = await _load_style_reference(db, repo.id, "code_docs")

    async with httpx.AsyncClient(timeout=30) as client:
        # ── 4. Ensure the persistent branch exists ────────────────────────────
        ok = await _ensure_branch(client, base_api, headers, repo.default_branch)
        if not ok:
            logger.error("  ❌ Could not ensure branch for %s", repo.full_name)
            return

        committed_any = False

        # ── 5. Regenerate README (always on schedule; style ref auto-applied) ──
        readme_content = generate_readme(
            repo.full_name,
            files_data,
            repo_id=repo.id,
            style_reference=readme_style,   # None → default prompt, str → mirrored format
        )

        result = await db.execute(
            select(Documentation).where(
                Documentation.repo_id == repo.id,
                Documentation.doc_type == "readme",
            )
        )
        doc = result.scalar_one_or_none()
        if doc:
            doc.content = readme_content
        else:
            doc = Documentation(repo_id=repo.id, doc_type="readme", content=readme_content)
            db.add(doc)

        ok = await _commit_file(
            client, base_api, headers,
            "README.md",
            readme_content,
            f"docs(autoscribe): refresh README [{ts}]"
            + (" [styled]" if readme_style else ""),
        )
        committed_any = committed_any or ok

        # ── 6. Regenerate docstrings for stale files (style ref auto-applied) ──
        for pf in parsed_files:
            if pf.file_path not in stale_paths:
                continue

            symbols = json.loads(pf.symbols)
            docstrings_json = generate_file_docstrings(
                pf.file_path,
                pf.language,
                symbols,
                style_reference=docstring_style,  # None → default, str → mirrored format
            )

            doc_type_key = f"docstrings:{pf.file_path}"
            result = await db.execute(
                select(Documentation).where(
                    Documentation.repo_id == repo.id,
                    Documentation.doc_type == doc_type_key,
                )
            )
            doc = result.scalar_one_or_none()
            if doc:
                doc.content = docstrings_json
            else:
                doc = Documentation(
                    repo_id=repo.id, doc_type=doc_type_key, content=docstrings_json
                )
                db.add(doc)

            gh_file = f"docs/code/{pf.file_path.replace('/', '_')}_docs.md"
            docstring_md = f"# Docstrings: `{pf.file_path}`\n\n```json\n{docstrings_json}\n```\n"
            ok = await _commit_file(
                client, base_api, headers,
                gh_file,
                docstring_md,
                f"docs(autoscribe): update docstrings for {pf.file_path} [{ts}]"
                + (" [styled]" if docstring_style else ""),
            )
            committed_any = committed_any or ok

        await db.commit()

        # ── 7. Ensure a PR exists so everything is reviewable ─────────────────
        if committed_any:
            await _upsert_pr(client, base_api, headers, repo.full_name, repo.default_branch)
            logger.info("  ✅ Done — committed updates for %s", repo.full_name)
        else:
            logger.info("  ✅ No changes committed for %s", repo.full_name)


# ─────────────────────────────────────────────────────────────────────────────
# Scheduled job — runs every POLL_INTERVAL_MINUTES
# ─────────────────────────────────────────────────────────────────────────────

async def _run_all_repos() -> None:
    """Scheduled job: iterate every tracked repo with auto_regenerate=True."""
    logger.info("⏰ Scheduler tick — scanning all repos")
    async with _async_session() as db:
        try:
            result = await db.execute(
                select(Repository, WebhookConfig)
                .join(WebhookConfig, WebhookConfig.repo_id == Repository.id, isouter=True)
            )
            rows = result.all()

            for repo, wh_config in rows:
                if wh_config and not wh_config.auto_regenerate:
                    continue

                user_result = await db.execute(
                    select(User).where(User.id == repo.user_id)
                )
                user = user_result.scalar_one_or_none()
                if not user or not user.access_token:
                    continue

                try:
                    await _update_repo(db, repo, user)
                except Exception as e:
                    logger.error("❌ Error updating repo %s: %s", repo.full_name, e)

        except Exception as e:
            logger.error("❌ Scheduler job failed: %s", e)


# ─────────────────────────────────────────────────────────────────────────────
# Public API: start / stop (called from main.py lifespan)
# ─────────────────────────────────────────────────────────────────────────────

def start_scheduler() -> None:
    """Start the background scheduler. Call once at app startup."""
    if scheduler.running:
        return
    scheduler.add_job(
        _run_all_repos,
        trigger="interval",
        minutes=POLL_INTERVAL_MINUTES,
        id="autoscribe_poll",
        replace_existing=True,
        next_run_time=datetime.now(timezone.utc),
    )
    scheduler.start()
    logger.info(
        "✅ AutoScribe scheduler started — polling every %d minutes", POLL_INTERVAL_MINUTES
    )


def stop_scheduler() -> None:
    """Stop the scheduler. Called on app shutdown."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("🛑 AutoScribe scheduler stopped")