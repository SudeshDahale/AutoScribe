"""
Fetch repository file tree from GitHub API (no git clone needed).
Downloads only source files we can parse, respecting rate limits.
"""
import asyncio
from pathlib import Path
import httpx

SUPPORTED_EXTENSIONS = {".py", ".js", ".jsx", ".ts", ".tsx"}
SKIP_DIRS = {"node_modules", ".git", "__pycache__", "venv", ".venv", "dist", "build", ".next"}
MAX_FILE_SIZE = 200_000  # 200 KB per file


async def fetch_repo_tree(owner: str, repo: str, branch: str, token: str) -> list[dict]:
    """Return flat list of all blobs in the repo tree from GitHub API."""
    url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1"
    headers = {"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"}
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(url, headers=headers)
    if resp.status_code != 200:
        return []
    data = resp.json()
    return [item for item in data.get("tree", []) if item.get("type") == "blob"]


async def download_file(client: httpx.AsyncClient, url: str, token: str) -> bytes | None:
    headers = {"Authorization": f"Bearer {token}", "Accept": "application/vnd.github.raw+json"}
    try:
        resp = await client.get(url, headers=headers, timeout=20)
        if resp.status_code == 200:
            return resp.content
    except Exception:
        pass
    return None


async def fetch_repo_files(
    owner: str, repo: str, branch: str, token: str, dest: Path
) -> list[Path]:
    """
    Download all parseable source files from a GitHub repo into dest/.
    Returns list of local Paths written.
    """
    dest.mkdir(parents=True, exist_ok=True)
    tree = await fetch_repo_tree(owner, repo, branch, token)

    # filter to only parseable files
    candidates = []
    for item in tree:
        path = item["path"]
        if any(part in SKIP_DIRS for part in Path(path).parts):
            continue
        if Path(path).suffix.lower() not in SUPPORTED_EXTENSIONS:
            continue
        size = item.get("size", 0)
        if size > MAX_FILE_SIZE:
            continue
        candidates.append(item)

    written: list[Path] = []
    base_url = f"https://api.github.com/repos/{owner}/{repo}/contents"

    async with httpx.AsyncClient(timeout=30) as client:
        # batch in groups of 10 to avoid hammering rate limits
        for i in range(0, len(candidates), 10):
            batch = candidates[i:i+10]
            tasks = [
                download_file(client, f"{base_url}/{item['path']}?ref={branch}", token)
                for item in batch
            ]
            results = await asyncio.gather(*tasks)
            for item, content in zip(batch, results):
                if content is None:
                    continue
                local_path = dest / item["path"]
                local_path.parent.mkdir(parents=True, exist_ok=True)
                local_path.write_bytes(content)
                written.append(local_path)

    return written