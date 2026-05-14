"""
Semantic Search + RAG engine using faiss + SentenceTransformers.
Pure-Python / pre-built wheels — no C++ compiler needed on Windows.

Storage: each repo's index is saved to ./autoscribe_faiss/<repo_id>/
  - index.faiss   — the faiss flat index
  - meta.json     — parallel list of symbol metadata
"""

import json
import os
from pathlib import Path
from typing import Optional

import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from groq import Groq

from app.core.config import settings

# ── Constants ─────────────────────────────────────────────────────────────────

FAISS_DIR   = Path("./autoscribe_faiss")
EMBED_MODEL = "all-MiniLM-L6-v2"   # 22 MB, fast, good quality
GROQ_MODEL  = "llama-3.3-70b-versatile"
VECTOR_DIM  = 384                   # all-MiniLM-L6-v2 output dimension

# ── Singleton embedder (loaded once per process) ──────────────────────────────

_embedder: Optional[SentenceTransformer] = None

def _get_embedder() -> SentenceTransformer:
    global _embedder
    if _embedder is None:
        _embedder = SentenceTransformer(EMBED_MODEL)
    return _embedder


# ── Per-repo storage helpers ───────────────────────────────────────────────────

def _repo_dir(repo_id: int) -> Path:
    d = FAISS_DIR / str(repo_id)
    d.mkdir(parents=True, exist_ok=True)
    return d

def _index_path(repo_id: int) -> Path:
    return _repo_dir(repo_id) / "index.faiss"

def _meta_path(repo_id: int) -> Path:
    return _repo_dir(repo_id) / "meta.json"

def _load_index(repo_id: int) -> tuple[faiss.Index, list[dict]] | tuple[None, None]:
    ip = _index_path(repo_id)
    mp = _meta_path(repo_id)
    if not ip.exists() or not mp.exists():
        return None, None
    index = faiss.read_index(str(ip))
    with open(mp) as f:
        meta = json.load(f)
    return index, meta

def _save_index(repo_id: int, index: faiss.Index, meta: list[dict]):
    faiss.write_index(index, str(_index_path(repo_id)))
    with open(_meta_path(repo_id), "w") as f:
        json.dump(meta, f)


# ── Public API ─────────────────────────────────────────────────────────────────

def index_repo(repo_id: int, parsed_files: list[dict]) -> int:
    """
    Embed all symbols and save a faiss index for this repo.
    Overwrites any existing index.
    Returns number of symbols indexed.
    """
    model = _get_embedder()

    texts: list[str] = []
    meta:  list[dict] = []

    for file in parsed_files:
        file_path = file["file_path"]
        language  = file["language"]
        for sym in file.get("symbols", []):
            texts.append(_symbol_to_text(sym, file_path, language))
            meta.append({
                "name":      sym["name"],
                "type":      sym.get("type", ""),
                "file_path": file_path,
                "language":  language,
                "line":      sym.get("line", 0),
                "docstring": sym.get("docstring", "") or "",
            })

    if not texts:
        return 0

    embeddings = model.encode(texts, show_progress_bar=False).astype("float32")

    # Normalise so inner-product == cosine similarity
    faiss.normalize_L2(embeddings)

    index = faiss.IndexFlatIP(VECTOR_DIM)   # Inner Product on normalised vecs
    index.add(embeddings)

    _save_index(repo_id, index, meta)
    return len(texts)


def search_repo(repo_id: int, query: str, n_results: int = 8) -> list[dict]:
    """
    Search indexed symbols by natural language query.
    Returns results sorted best-first with a cosine similarity score.
    """
    index, meta = _load_index(repo_id)
    if index is None:
        return []

    model = _get_embedder()
    q_vec = model.encode([query]).astype("float32")
    faiss.normalize_L2(q_vec)

    k = min(n_results, index.ntotal)
    scores, indices = index.search(q_vec, k)

    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx == -1:
            continue
        entry = dict(meta[idx])
        entry["score"] = round(float(score), 4)
        results.append(entry)

    return results   # already sorted best-first by faiss


def rag_query(repo_id: int, question: str) -> dict:
    """
    RAG-powered Q&A:
    1. Retrieve top-k relevant symbols via semantic search.
    2. Build a context block from names/docstrings/file paths.
    3. Ask Groq to answer the question given that context.

    Returns { "answer": str, "sources": [result, ...] }
    """
    sources = search_repo(repo_id, question, n_results=6)

    if not sources:
        return {
            "answer": (
                "I couldn't find any indexed documentation for this repository. "
                "Please index the repo first using the ⚡ Index Repo button."
            ),
            "sources": [],
        }

    context_lines = []
    for s in sources:
        context_lines.append(
            f"[{s['type']}] {s['name']} — {s['file_path']} line {s['line']}\n"
            f"  Docstring: {s['docstring'] or '(none)'}"
        )
    context = "\n\n".join(context_lines)

    prompt = (
        "You are a code assistant for a software repository.\n"
        "Answer the user's question using ONLY the context below "
        "(parsed code symbols and their docstrings).\n"
        "Be concise and specific. If the answer isn't in the context, say so honestly.\n\n"
        f"CONTEXT:\n{context}\n\n"
        f"QUESTION: {question}"
    )

    groq_client = Groq(api_key=settings.GROQ_API_KEY)
    response = groq_client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a helpful code documentation assistant. "
                    "Answer questions about codebases based on parsed symbol context. "
                    "Be concise."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
        max_tokens=1024,
    )
    answer = response.choices[0].message.content.strip()

    return {"answer": answer, "sources": sources}


def get_index_stats(repo_id: int) -> dict:
    """Return whether this repo is indexed and how many symbols."""
    index, meta = _load_index(repo_id)
    if index is None:
        return {"indexed": False, "symbol_count": 0}
    return {"indexed": True, "symbol_count": index.ntotal}


# ── Helper ─────────────────────────────────────────────────────────────────────

def _symbol_to_text(sym: dict, file_path: str, language: str) -> str:
    parts = [
        f"{sym.get('type', 'symbol')}: {sym['name']}",
        f"file: {file_path}",
        f"language: {language}",
    ]
    if sym.get("docstring"):
        parts.append(f"documentation: {sym['docstring']}")
    return "\n".join(parts)