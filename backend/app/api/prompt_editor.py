"""
Prompt-based editing API: manage prompt templates, edit history,
preview generated content, and validate prompts before saving.
"""
import json
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import BaseModel

from app.core.database import get_db
from app.models.user import User
from app.models.repository import Repository
from app.models.documentation import Documentation
from app.core.doc_generator import _chat

router = APIRouter()

# ── Built-in Prompt Templates ──────────────────────────────────────────────────

BUILT_IN_TEMPLATES = [
    {
        "id": "tpl_readme",
        "name": "README Generator",
        "description": "Full README with badges, features, and setup guide",
        "doc_type": "readme",
        "prompt": (
            "You are a senior engineer. Given this codebase structure:\n{context}\n\n"
            "Generate a professional README.md for {repo_name} that includes:\n"
            "1. Title, description, and shield badges\n2. Feature highlights\n"
            "3. Tech stack table\n4. Project structure\n5. Quick-start guide\n"
            "6. API overview (if endpoints detected)\n7. Contributing and License sections.\n"
            "Output only Markdown."
        ),
        "variables": ["context", "repo_name"],
        "category": "documentation",
    },
    {
        "id": "tpl_arch",
        "name": "Architecture Doc",
        "description": "C4-style architecture documentation with component diagrams",
        "doc_type": "architecture",
        "prompt": (
            "You are a software architect. Analyse this codebase:\n{context}\n\n"
            "Write an Architecture Decision Record and system overview for {repo_name}:\n"
            "1. System context and purpose\n2. Key components and their responsibilities\n"
            "3. Data flow and integration points\n4. Technology choices and rationale\n"
            "5. Deployment topology\n6. Known trade-offs and future concerns.\n"
            "Output Markdown with clear headings."
        ),
        "variables": ["context", "repo_name"],
        "category": "documentation",
    },
    {
        "id": "tpl_api",
        "name": "API Documentation",
        "description": "OpenAPI-style endpoint documentation with request/response examples",
        "doc_type": "api_docs",
        "prompt": (
            "You are a technical writer specialising in API docs. Codebase:\n{context}\n\n"
            "Generate API documentation for {repo_name}:\n"
            "1. Authentication (how to obtain and use tokens)\n"
            "2. Base URL and versioning\n3. For each endpoint: method, path, description, "
            "path/query/body params, response shape, error codes, and a curl example.\n"
            "4. Rate-limiting and pagination notes.\n"
            "Output Markdown."
        ),
        "variables": ["context", "repo_name"],
        "category": "documentation",
    },
    {
        "id": "tpl_runbook",
        "name": "Engineering Runbook",
        "description": "Operational runbook with deployment, rollback, and on-call procedures",
        "doc_type": "runbook",
        "prompt": (
            "You are a senior SRE. Analyse this service:\n{context}\n\n"
            "Write an operational runbook for {repo_name}:\n"
            "1. Service overview and SLOs\n2. Local development setup\n"
            "3. Deployment procedure (step-by-step)\n4. Rollback procedure\n"
            "5. Common failure modes and remediation\n6. Monitoring and alerting checklist\n"
            "7. On-call escalation path.\nOutput Markdown."
        ),
        "variables": ["context", "repo_name"],
        "category": "engineering",
    },
    {
        "id": "tpl_onboarding",
        "name": "Onboarding Guide",
        "description": "Day-1 onboarding guide for new engineers joining the project",
        "doc_type": "onboarding",
        "prompt": (
            "You are a tech lead writing for a new hire. Codebase:\n{context}\n\n"
            "Write an onboarding guide for {repo_name}:\n"
            "1. Project purpose and team context\n2. Prerequisites and local setup (step-by-step)\n"
            "3. Codebase tour: where to find things\n4. Key concepts and domain vocabulary\n"
            "5. First tasks / good-first-issues\n6. Code review norms and PR process\n"
            "7. Useful commands and scripts.\nOutput Markdown."
        ),
        "variables": ["context", "repo_name"],
        "category": "engineering",
    },
    {
        "id": "tpl_codelevel",
        "name": "Code-Level Documentation",
        "description": "Inline docstrings and module-level comments for all symbols",
        "doc_type": "code_docs",
        "prompt": (
            "You are a senior engineer who writes precise documentation. File: {file_path}\n"
            "Language: {language}\nSymbols:\n{symbols}\n\n"
            "For every symbol write a concise docstring/JSDoc comment that:\n"
            "- Describes what the symbol does (not how)\n- Lists params with types and semantics\n"
            "- Documents return value and raised exceptions\n"
            "Return a JSON array: "
            '[{"name":"...", "type":"...", "docstring":"..."}]. Only JSON, no markdown fences.'
        ),
        "variables": ["file_path", "language", "symbols"],
        "category": "code",
    },
]

# ── Pydantic Models ────────────────────────────────────────────────────────────

class PromptPreviewRequest(BaseModel):
    prompt: str
    doc_type: str
    repo_id: int
    file_path: Optional[str] = None

class PromptValidateRequest(BaseModel):
    prompt: str
    doc_type: str

class SavePromptTemplateRequest(BaseModel):
    name: str
    description: str
    prompt: str
    doc_type: str
    category: str
    variables: list[str]

class GenerateWithPromptRequest(BaseModel):
    prompt: str
    doc_type: str
    repo_id: int
    file_path: Optional[str] = None
    create_pr: bool = False

class CreatePRRequest(BaseModel):
    repo_id: int
    doc_type: str
    content: str
    branch_name: Optional[str] = None
    pr_title: Optional[str] = None

# ── Auth helper ────────────────────────────────────────────────────────────────

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

# ── Context builder ────────────────────────────────────────────────────────────

async def _build_context(db: AsyncSession, repo_id: int, file_path: Optional[str] = None) -> dict:
    """Build context dict from parsed files for prompt interpolation."""
    from app.models.parsed_file import ParsedFile
    result = await db.execute(select(ParsedFile).where(ParsedFile.repo_id == repo_id))
    parsed_files = result.scalars().all()

    if file_path:
        pf = next((f for f in parsed_files if f.file_path == file_path), None)
        if not pf:
            raise HTTPException(status_code=404, detail="File not found in parse results")
        symbols = json.loads(pf.symbols)
        symbol_list = "\n".join(
            f"- {s['type']} `{s['name']}` (line {s['line']})"
            + (f": {s['docstring']}" if s.get("docstring") else "")
            for s in symbols
        )
        return {
            "file_path": pf.file_path,
            "language": pf.language,
            "symbols": symbol_list,
        }

    summary_lines = []
    for f in parsed_files[:40]:
        symbols = json.loads(f.symbols)
        sym_names = [f"{s['type']} {s['name']}" for s in symbols[:8]]
        summary_lines.append(f"- {f.file_path} ({f.language}): {', '.join(sym_names)}")
    return {"context": "\n".join(summary_lines)}

def _interpolate(prompt: str, variables: dict) -> str:
    """Replace {variable} placeholders with actual values."""
    for k, v in variables.items():
        prompt = prompt.replace(f"{{{k}}}", v)
    return prompt

# ── Validation ────────────────────────────────────────────────────────────────

SAFETY_PATTERNS = [
    "ignore previous", "ignore all", "disregard", "jailbreak",
    "act as", "pretend you are", "you are now", "new persona",
    "system prompt", "bypass", "override instructions",
]

def validate_prompt(prompt: str, doc_type: str) -> dict:
    """Run safety and quality checks on a prompt."""
    issues = []
    warnings = []

    # Safety checks
    lower = prompt.lower()
    for pattern in SAFETY_PATTERNS:
        if pattern in lower:
            issues.append(f"Potentially unsafe pattern detected: '{pattern}'")

    # Quality checks
    if len(prompt.strip()) < 20:
        issues.append("Prompt is too short (minimum 20 characters)")
    if len(prompt) > 8000:
        warnings.append("Prompt is very long and may hit token limits")
    if "{context}" not in prompt and doc_type in ("readme", "architecture", "api_docs", "runbook", "onboarding"):
        warnings.append("Tip: include {context} to inject codebase structure")
    if "{repo_name}" not in prompt and doc_type in ("readme", "architecture", "api_docs"):
        warnings.append("Tip: include {repo_name} for the repository name")

    return {
        "valid": len(issues) == 0,
        "issues": issues,
        "warnings": warnings,
        "character_count": len(prompt),
        "estimated_tokens": len(prompt) // 4,
    }

# ── Routes ─────────────────────────────────────────────────────────────────────

@router.get("/templates")
async def list_templates():
    """Return all built-in prompt templates."""
    return {"templates": BUILT_IN_TEMPLATES}

@router.post("/validate")
async def validate_prompt_endpoint(body: PromptValidateRequest):
    """Validate a prompt for safety and quality issues."""
    result = validate_prompt(body.prompt, body.doc_type)
    return result

@router.post("/preview")
async def preview_with_prompt(
    body: PromptPreviewRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate a preview with a custom prompt without saving.
    Returns the generated content and metadata.
    """
    result = await db.execute(
        select(Repository).where(Repository.id == body.repo_id, Repository.user_id == current_user.id)
    )
    repo = result.scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    validation = validate_prompt(body.prompt, body.doc_type)
    if not validation["valid"]:
        raise HTTPException(status_code=422, detail={"validation": validation})

    ctx = await _build_context(db, body.repo_id, body.file_path)
    ctx["repo_name"] = repo.full_name

    final_prompt = _interpolate(body.prompt, ctx)

    system = (
        "You are a senior software engineer and technical writer. "
        "Generate precise, accurate documentation based only on the provided codebase context. "
        "Output only the requested documentation, no preamble."
    )
    content = _chat(final_prompt, system)

    return {
        "content": content,
        "prompt_used": final_prompt,
        "doc_type": body.doc_type,
        "repo": repo.full_name,
        "preview": True,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "warnings": validation["warnings"],
    }

@router.post("/generate")
async def generate_and_save(
    body: GenerateWithPromptRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate documentation with a custom prompt and save to DB.
    Optionally creates a GitHub PR with the generated content.
    """
    result = await db.execute(
        select(Repository).where(Repository.id == body.repo_id, Repository.user_id == current_user.id)
    )
    repo = result.scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    validation = validate_prompt(body.prompt, body.doc_type)
    if not validation["valid"]:
        raise HTTPException(status_code=422, detail={"validation": validation})

    ctx = await _build_context(db, body.repo_id, body.file_path)
    ctx["repo_name"] = repo.full_name

    final_prompt = _interpolate(body.prompt, ctx)

    system = (
        "You are a senior software engineer and technical writer. "
        "Generate precise, accurate documentation based only on the provided codebase context. "
        "Output only the requested documentation, no preamble."
    )
    content = _chat(final_prompt, system)

    # Save to documentation table
    doc_type_key = body.doc_type
    if body.file_path:
        doc_type_key = f"{body.doc_type}:{body.file_path}"

    existing = await db.execute(
        select(Documentation).where(
            Documentation.repo_id == body.repo_id,
            Documentation.doc_type == doc_type_key,
        )
    )
    doc = existing.scalar_one_or_none()
    if doc:
        doc.content = content
    else:
        doc = Documentation(repo_id=body.repo_id, doc_type=doc_type_key, content=content)
        db.add(doc)

    # Save to edit history
    history_key = f"history:{doc_type_key}"
    history_entry = {
        "prompt": body.prompt,
        "content_preview": content[:300],
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
    hist_result = await db.execute(
        select(Documentation).where(
            Documentation.repo_id == body.repo_id,
            Documentation.doc_type == history_key,
        )
    )
    hist_doc = hist_result.scalar_one_or_none()
    if hist_doc:
        try:
            history = json.loads(hist_doc.content)
        except Exception:
            history = []
        history.insert(0, history_entry)
        history = history[:20]  # Keep last 20
        hist_doc.content = json.dumps(history)
    else:
        hist_doc = Documentation(
            repo_id=body.repo_id,
            doc_type=history_key,
            content=json.dumps([history_entry]),
        )
        db.add(hist_doc)

    await db.commit()

    pr_result = None
    if body.create_pr:
        try:
            pr_result = await _create_github_pr(
                repo=repo,
                user=current_user,
                doc_type=body.doc_type,
                content=content,
                file_path=body.file_path,
            )
        except Exception as e:
            pr_result = {"error": str(e)}

    return {
        "content": content,
        "doc_type": doc_type_key,
        "saved": True,
        "pr": pr_result,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }

@router.get("/{repo_id}/history/{doc_type}")
async def get_edit_history(
    repo_id: int,
    doc_type: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the last 20 edits for a given doc type."""
    result = await db.execute(
        select(Repository).where(Repository.id == repo_id, Repository.user_id == current_user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Repository not found")

    history_key = f"history:{doc_type}"
    result = await db.execute(
        select(Documentation).where(
            Documentation.repo_id == repo_id,
            Documentation.doc_type == history_key,
        )
    )
    doc = result.scalar_one_or_none()
    if not doc:
        return {"history": []}
    try:
        return {"history": json.loads(doc.content)}
    except Exception:
        return {"history": []}

@router.post("/{repo_id}/create-pr")
async def create_pr_endpoint(
    repo_id: int,
    body: CreatePRRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a GitHub PR with the given documentation content."""
    result = await db.execute(
        select(Repository).where(Repository.id == repo_id, Repository.user_id == current_user.id)
    )
    repo = result.scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    try:
        pr_result = await _create_github_pr(
            repo=repo,
            user=current_user,
            doc_type=body.doc_type,
            content=body.content,
            branch_name=body.branch_name,
            pr_title=body.pr_title,
        )
        return pr_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── GitHub PR helper ───────────────────────────────────────────────────────────

DOC_TYPE_TO_FILE = {
    "readme": "README.md",
    "architecture": "docs/ARCHITECTURE.md",
    "api_docs": "docs/API.md",
    "runbook": "docs/RUNBOOK.md",
    "onboarding": "docs/ONBOARDING.md",
    "code_docs": "docs/CODE_DOCUMENTATION.md",
}

async def _create_github_pr(
    repo,
    user,
    doc_type: str,
    content: str,
    file_path: Optional[str] = None,
    branch_name: Optional[str] = None,
    pr_title: Optional[str] = None,
) -> dict:
    """
    Push documentation to a SINGLE persistent branch ('autoscribe/docs').
    Creates the branch once; subsequent calls just update the file on that
    same branch and upsert (or reuse) the open PR.
    """
    import httpx, base64

    headers = {
        "Authorization": f"Bearer {user.access_token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    base_api = f"https://api.github.com/repos/{repo.full_name}"
    ts = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")

    # ── FIXED branch name — never changes between calls ──────────────────────
    branch = branch_name or "autoscribe/docs"

    # Determine target file path
    if file_path and doc_type == "code_docs":
        target_file = f"docs/code/{file_path.replace('/', '_')}_docs.md"
    else:
        target_file = DOC_TYPE_TO_FILE.get(doc_type, f"docs/{doc_type}.md")

    title = pr_title or "docs: AutoScribe — continuous documentation updates"

    async with httpx.AsyncClient(timeout=30) as client:
        # ── 1. Get default branch SHA ─────────────────────────────────────────
        r = await client.get(
            f"{base_api}/git/ref/heads/{repo.default_branch}", headers=headers
        )
        if r.status_code != 200:
            raise Exception(f"Could not get default branch ref: {r.text}")
        sha = r.json()["object"]["sha"]

        # ── 2. Create branch ONLY if it doesn't exist (422 = already exists) ──
        r = await client.post(
            f"{base_api}/git/refs",
            headers=headers,
            json={"ref": f"refs/heads/{branch}", "sha": sha},
        )
        if r.status_code not in (200, 201, 422):
            raise Exception(f"Could not create branch: {r.text}")
        # 422 is fine — branch already exists, we just push onto it below.

        # ── 3. Get current file SHA on that branch (needed to update, not 409) ─
        file_sha = None
        r = await client.get(
            f"{base_api}/contents/{target_file}?ref={branch}", headers=headers
        )
        if r.status_code == 200:
            file_sha = r.json().get("sha")

        # ── 4. Commit the file ────────────────────────────────────────────────
        payload: dict = {
            "message": f"docs(autoscribe): update {target_file} [{ts}]",
            "content": base64.b64encode(content.encode()).decode(),
            "branch": branch,
        }
        if file_sha:
            payload["sha"] = file_sha  # required for updates

        r = await client.put(
            f"{base_api}/contents/{target_file}",
            headers=headers,
            json=payload,
        )
        if r.status_code not in (200, 201):
            raise Exception(f"Could not commit file: {r.text}")

        # ── 5. Upsert PR — reuse the existing open PR if one already exists ───
        pr_url = None
        pr_number = None

        # Check for an existing open PR from our branch
        r = await client.get(
            f"{base_api}/pulls",
            headers=headers,
            params={
                "state": "open",
                "head": f"{repo.full_name.split('/')[0]}:{branch}",
                "base": repo.default_branch,
            },
        )
        if r.status_code == 200 and r.json():
            existing_pr = r.json()[0]
            pr_url = existing_pr["html_url"]
            pr_number = existing_pr["number"]
            # Update the PR title/body to reflect the latest generation time
            await client.patch(
                f"{base_api}/pulls/{pr_number}",
                headers=headers,
                json={
                    "title": title,
                    "body": (
                        "## 📝 AutoScribe — Continuous Documentation\n\n"
                        "This PR is **automatically kept up to date** by AutoScribe.\n"
                        "New commits are pushed to this branch whenever docs are regenerated.\n\n"
                        f"**Last updated:** {datetime.now(timezone.utc).isoformat()}\n\n"
                        "---\n*Review the changes and merge when ready. "
                        "AutoScribe will keep pushing to this branch.*"
                    ),
                },
            )
        else:
            # No open PR yet — create one
            r = await client.post(
                f"{base_api}/pulls",
                headers=headers,
                json={
                    "title": title,
                    "head": branch,
                    "base": repo.default_branch,
                    "body": (
                        "## 📝 AutoScribe — Continuous Documentation\n\n"
                        "This PR is **automatically kept up to date** by AutoScribe.\n"
                        "New commits will be pushed to this branch on every doc regeneration.\n\n"
                        f"**First generated:** {datetime.now(timezone.utc).isoformat()}\n\n"
                        "---\n*Review the changes and merge when ready.*"
                    ),
                },
            )
            if r.status_code not in (200, 201):
                # PR creation failed (e.g. nothing to compare) — still return success
                return {
                    "pr_url": None,
                    "pr_number": None,
                    "branch": branch,
                    "file": target_file,
                    "note": f"File committed to branch '{branch}'. PR creation skipped: {r.text}",
                }
            pr_data = r.json()
            pr_url = pr_data["html_url"]
            pr_number = pr_data["number"]

        return {
            "pr_url": pr_url,
            "pr_number": pr_number,
            "branch": branch,
            "file": target_file,
        }