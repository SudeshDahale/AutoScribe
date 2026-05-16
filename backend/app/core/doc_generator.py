"""
AI documentation generator using Groq LLM.
Generates README and function-level docstrings from parsed symbols.

Style references: if a (repo_id, doc_type) style reference has been saved via the
prompt editor API, it is automatically injected into every generation call so the
output matches the user's preferred format — even for scheduled / webhook-triggered runs.
"""
import json
from groq import Groq
from app.core.config import settings

client = Groq(api_key=settings.GROQ_API_KEY)
MODEL = "llama-3.3-70b-versatile"


def _chat(prompt: str, system: str) -> str:
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
        max_tokens=4096,
    )
    return response.choices[0].message.content.strip()


# ── Style-reference injection helpers ─────────────────────────────────────────

def _style_block(reference_text: str, doc_type: str) -> str:
    """
    Build the style-reference section that gets prepended to any prompt.
    Keeps the reference trimmed to avoid blowing the context window.
    """
    trimmed = reference_text[:6000]
    if len(reference_text) > 6000:
        trimmed += "\n\n[... reference truncated ...]"
    return (
        f"\n\n## STYLE REFERENCE\n"
        f"The user has provided a reference document that defines the desired format for "
        f"`{doc_type}` output. Match its section structure, heading hierarchy, tone, "
        f"formatting patterns (badges, tables, code blocks), and approximate length. "
        f"NEVER copy the reference content — only replicate its shape and style.\n\n"
        f"```\n{trimmed}\n```\n"
    )


async def _load_style_reference(repo_id: int | None, doc_type: str) -> str | None:
    """
    Load a saved style reference from the DB for (repo_id, doc_type).
    Returns the raw reference text, or None if not set.
    Silently swallows errors so a missing reference never breaks generation.
    """
    if repo_id is None:
        return None
    try:
        from app.core.database import engine
        from sqlalchemy.ext.asyncio import AsyncSession
        from sqlalchemy.orm import sessionmaker
        from sqlalchemy import select
        from app.models.documentation import Documentation

        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        async with async_session() as db:
            result = await db.execute(
                select(Documentation).where(
                    Documentation.repo_id == repo_id,
                    Documentation.doc_type == f"style_reference:{doc_type}",
                )
            )
            doc = result.scalar_one_or_none()
            if doc:
                data = json.loads(doc.content)
                return data.get("reference_text")
    except Exception:
        pass
    return None


# ── Public generators ─────────────────────────────────────────────────────────

def generate_readme(repo_full_name: str, parsed_files: list[dict],
                    repo_id: int | None = None, style_reference: str | None = None) -> str:
    """
    Generate a full README.md from parsed file structure.
    Pass style_reference (raw text) to force a specific format.
    Pass repo_id to auto-load any saved style reference from the DB.
    """
    summary_lines = []
    for f in parsed_files[:40]:
        symbols = [f"{s['type']} {s['name']}" for s in f["symbols"][:10]]
        summary_lines.append(f"- {f['file_path']} ({f['language']}): {', '.join(symbols)}")
    summary = "\n".join(summary_lines)

    style_section = ""
    if style_reference:
        style_section = _style_block(style_reference, "readme")

    prompt = (
        f"Repository: {repo_full_name}\n\n"
        f"Codebase structure (files and their symbols):\n{summary}"
        f"{style_section}\n\n"
        f"Generate a professional README.md for this repository. Include:\n"
        f"1. Project title and a concise description (inferred from the code structure)\n"
        f"2. Features list (inferred from routers, services, models found)\n"
        f"3. Tech stack (inferred from file types and naming)\n"
        f"4. Project structure section\n"
        f"5. Getting started (generic but sensible)\n"
        f"6. API overview if routers/endpoints are detected\n\n"
        f"Write in clean Markdown. Be specific to this codebase, not generic."
        + ("\n\nIMPORTANT: Follow the STYLE REFERENCE section above for structure and formatting." if style_section else "")
    )

    system = (
        "You are a senior software engineer who writes excellent, accurate technical documentation. "
        "Output only the README markdown, no extra commentary."
    )
    return _chat(prompt, system)


def generate_file_docstrings(file_path: str, language: str, symbols: list[dict],
                              style_reference: str | None = None) -> str:
    """Generate docstring suggestions for all symbols in a file."""
    symbol_list = "\n".join(
        [f"- {s['type']} `{s['name']}` (line {s['line']})"
         + (f": existing docstring: {s['docstring']}" if s.get("docstring") else "")
         for s in symbols]
    )

    style_section = ""
    if style_reference:
        style_section = _style_block(style_reference, "code_docs")

    prompt = (
        f"File: {file_path}\nLanguage: {language}\n\nSymbols found:\n{symbol_list}"
        f"{style_section}\n\n"
        f"For each symbol, write a concise docstring/JSDoc comment explaining what it "
        f"likely does based on its name and type.\n"
        f"Format your response as JSON like this:\n"
        f'[\n  {{"name": "function_name", "type": "function", "docstring": "Does X by doing Y."}},\n  ...\n]\n'
        f"Only output the JSON array, nothing else."
    )

    system = "You are a senior engineer writing precise, helpful docstrings. Output only valid JSON."

    raw = _chat(prompt, system)
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip().rstrip("```").strip()

    try:
        parsed = json.loads(raw)
        return json.dumps(parsed)
    except Exception:
        return json.dumps([{"name": s["name"], "type": s["type"], "docstring": ""} for s in symbols])


def _generate_doc_type(repo_full_name: str, parsed_files: list[dict], doc_type: str,
                        style_reference: str | None = None) -> str:
    """Generate a specific documentation type from parsed file structure."""
    summary_lines = []
    for f in parsed_files[:40]:
        symbols = [f"{s['type']} {s['name']}" for s in f["symbols"][:10]]
        summary_lines.append(f"- {f['file_path']} ({f['language']}): {', '.join(symbols)}")
    summary = "\n".join(summary_lines)

    style_section = _style_block(style_reference, doc_type) if style_reference else ""

    prompts = {
        "architecture": (
            f"Repository: {repo_full_name}\nCodebase:\n{summary}{style_section}\n\n"
            "Write architecture documentation:\n"
            "1. System context and purpose\n2. Key components and responsibilities\n"
            "3. Data flow between components\n4. Technology choices observed\n"
            "5. Deployment notes\n6. Trade-offs and open questions\nOutput Markdown."
        ),
        "api_docs": (
            f"Repository: {repo_full_name}\nCodebase:\n{summary}{style_section}\n\n"
            "Generate API documentation:\n"
            "1. Authentication mechanism\n2. Base URL and versioning\n"
            "3. All detected endpoints with: method, path, description, params, response, errors, curl example\n"
            "4. Rate limiting and pagination\nOutput Markdown."
        ),
        "runbook": (
            f"Repository: {repo_full_name}\nCodebase:\n{summary}{style_section}\n\n"
            "Write an operational runbook:\n"
            "1. Service overview and SLOs\n2. Environment variables and configuration\n"
            "3. Local development setup\n4. Deployment steps\n5. Rollback procedure\n"
            "6. Common failure modes and fixes\n7. Monitoring checklist\nOutput Markdown."
        ),
        "onboarding": (
            f"Repository: {repo_full_name}\nCodebase:\n{summary}{style_section}\n\n"
            "Write a new-engineer onboarding guide:\n"
            "1. Project purpose and team context\n2. Prerequisites and local setup\n"
            "3. Codebase tour\n4. Key concepts and domain vocabulary\n"
            "5. First tasks\n6. Code review norms\n7. Useful commands\nOutput Markdown."
        ),
    }

    style_reminder = "\n\nIMPORTANT: Follow the STYLE REFERENCE section above for structure and formatting." if style_section else ""
    prompt = prompts.get(doc_type, f"Describe the repository {repo_full_name} based on:\n{summary}") + style_reminder
    system = "You are a senior engineer writing precise technical documentation. Output only Markdown."
    return _chat(prompt, system)