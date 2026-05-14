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