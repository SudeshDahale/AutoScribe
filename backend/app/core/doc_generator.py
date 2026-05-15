"""
AI documentation generator using Groq LLM.
Generates README and function-level docstrings from parsed symbols.
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


def generate_readme(repo_full_name: str, parsed_files: list[dict]) -> str:
    """Generate a full README.md from parsed file structure."""

    # Build a compact summary of the codebase
    summary_lines = []
    for f in parsed_files[:40]:  # cap to avoid token limit
        symbols = [f"{s['type']} {s['name']}" for s in f["symbols"][:10]]
        summary_lines.append(f"- {f['file_path']} ({f['language']}): {', '.join(symbols)}")

    summary = "\n".join(summary_lines)

    prompt = f"""Repository: {repo_full_name}

Codebase structure (files and their symbols):
{summary}

Generate a professional README.md for this repository. Include:
1. Project title and a concise description (inferred from the code structure)
2. Features list (inferred from routers, services, models found)
3. Tech stack (inferred from file types and naming)
4. Project structure section
5. Getting started (generic but sensible)
6. API overview if routers/endpoints are detected

Write in clean Markdown. Be specific to this codebase, not generic."""

    system = "You are a senior software engineer who writes excellent, accurate technical documentation. Output only the README markdown, no extra commentary."

    return _chat(prompt, system)


def generate_file_docstrings(file_path: str, language: str, symbols: list[dict]) -> str:
    """Generate docstring suggestions for all symbols in a file."""

    symbol_list = "\n".join(
        [f"- {s['type']} `{s['name']}` (line {s['line']})"
         + (f": existing docstring: {s['docstring']}" if s.get("docstring") else "")
         for s in symbols]
    )

    prompt = f"""File: {file_path}
Language: {language}

Symbols found:
{symbol_list}

For each symbol, write a concise docstring/JSDoc comment explaining what it likely does based on its name and type.
Format your response as JSON like this:
[
  {{"name": "function_name", "type": "function", "docstring": "Does X by doing Y."}},
  ...
]
Only output the JSON array, nothing else."""

    system = "You are a senior engineer writing precise, helpful docstrings. Output only valid JSON."

    raw = _chat(prompt, system)

    # strip markdown fences if model wraps in ```json
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


def _generate_doc_type(repo_full_name: str, parsed_files: list[dict], doc_type: str) -> str:
    """Generate a specific documentation type from parsed file structure."""
    summary_lines = []
    for f in parsed_files[:40]:
        symbols = [f"{s['type']} {s['name']}" for s in f["symbols"][:10]]
        summary_lines.append(f"- {f['file_path']} ({f['language']}): {', '.join(symbols)}")
    summary = "\n".join(summary_lines)

    prompts = {
        "architecture": f"""Repository: {repo_full_name}
Codebase:\n{summary}

Write architecture documentation:
1. System context and purpose
2. Key components and responsibilities (based on file/symbol names)
3. Data flow between components
4. Technology choices observed
5. Deployment notes
6. Trade-offs and open questions
Output Markdown with clear headings.""",

        "api_docs": f"""Repository: {repo_full_name}
Codebase:\n{summary}

Generate API documentation:
1. Authentication mechanism (inferred from auth files/functions)
2. Base URL and versioning
3. All detected endpoints with: method, path, description, params, response, errors, curl example
4. Rate limiting and pagination
Output Markdown.""",

        "runbook": f"""Repository: {repo_full_name}
Codebase:\n{summary}

Write an operational runbook:
1. Service overview and SLOs
2. Environment variables and configuration
3. Local development setup
4. Deployment steps
5. Rollback procedure
6. Common failure modes and fixes
7. Monitoring checklist
Output Markdown.""",

        "onboarding": f"""Repository: {repo_full_name}
Codebase:\n{summary}

Write a new-engineer onboarding guide:
1. Project purpose and team context
2. Prerequisites and local setup
3. Codebase tour
4. Key concepts and domain vocabulary
5. First tasks
6. Code review norms
7. Useful commands
Output Markdown.""",
    }

    prompt = prompts.get(doc_type, f"Describe the repository {repo_full_name} based on:\n{summary}")
    system = "You are a senior engineer writing precise technical documentation. Output only Markdown."
    return _chat(prompt, system)