"""
AST parser using Tree-sitter.
Extracts functions and classes from Python, JavaScript, and TypeScript files.
"""
import json
from pathlib import Path
from typing import Any

import tree_sitter_python as tspython
import tree_sitter_javascript as tsjavascript
import tree_sitter_typescript as tstypescript
from tree_sitter import Language, Parser


# Build language objects once at import time
PY_LANGUAGE = Language(tspython.language(), "python")
JS_LANGUAGE = Language(tsjavascript.language(), "javascript")
TS_LANGUAGE = Language(tstypescript.language_typescript(), "typescript")
TSX_LANGUAGE = Language(tstypescript.language_tsx(), "tsx")

EXTENSION_MAP = {
    ".py": ("python", PY_LANGUAGE),
    ".js": ("javascript", JS_LANGUAGE),
    ".jsx": ("javascript", JS_LANGUAGE),
    ".ts": ("typescript", TS_LANGUAGE),
    ".tsx": ("tsx", TSX_LANGUAGE),
}

# Tree-sitter node types we care about per language
SYMBOL_NODES = {
    "python": {
        "function_definition": "function",
        "async_function_definition": "function",
        "class_definition": "class",
    },
    "javascript": {
        "function_declaration": "function",
        "arrow_function": "function",
        "class_declaration": "class",
        "method_definition": "method",
    },
    "typescript": {
        "function_declaration": "function",
        "arrow_function": "function",
        "class_declaration": "class",
        "method_definition": "method",
        "interface_declaration": "interface",
        "type_alias_declaration": "type",
    },
    "tsx": {
        "function_declaration": "function",
        "arrow_function": "function",
        "class_declaration": "class",
        "method_definition": "method",
        "interface_declaration": "interface",
        "type_alias_declaration": "type",
    },
}


def _get_node_name(node, source: bytes) -> str:
    """Extract the identifier name from a node."""
    for child in node.children:
        if child.type == "identifier":
            return source[child.start_byte:child.end_byte].decode("utf-8", errors="replace")
    return "<anonymous>"


def _extract_docstring_python(node, source: bytes) -> str:
    """For Python, grab the first string literal in the body as docstring."""
    for child in node.children:
        if child.type == "block":
            for stmt in child.children:
                if stmt.type == "expression_statement":
                    for expr in stmt.children:
                        if expr.type == "string":
                            raw = source[expr.start_byte:expr.end_byte].decode("utf-8", errors="replace")
                            return raw.strip("'\"").strip()
    return ""


def _walk(node, source: bytes, language: str, symbols: list[dict[str, Any]]):
    node_map = SYMBOL_NODES.get(language, {})
    if node.type in node_map:
        name = _get_node_name(node, source)
        docstring = ""
        if language == "python":
            docstring = _extract_docstring_python(node, source)
        symbols.append({
            "type": node_map[node.type],
            "name": name,
            "line": node.start_point[0] + 1,
            "docstring": docstring,
        })
    for child in node.children:
        _walk(child, source, language, symbols)


def parse_file(file_path: Path) -> dict[str, Any] | None:
    """
    Parse a single file. Returns:
      { "language": str, "symbols": [ {type, name, line, docstring} ] }
    or None if the extension is not supported.
    """
    suffix = file_path.suffix.lower()
    if suffix not in EXTENSION_MAP:
        return None

    language_name, lang_obj = EXTENSION_MAP[suffix]
    try:
        source = file_path.read_bytes()
    except (OSError, PermissionError):
        return None

    parser = Parser()
    parser.set_language(lang_obj)
    tree = parser.parse(source)

    symbols: list[dict[str, Any]] = []
    _walk(tree.root_node, source, language_name, symbols)

    return {"language": language_name, "symbols": symbols}


def parse_repo(repo_dir: Path) -> list[dict[str, Any]]:
    """
    Walk a local repo directory and parse every supported file.
    Returns a list of:
      { "file_path": str, "language": str, "symbols": [...] }
    Skips node_modules, .git, __pycache__, venv, dist, build.
    """
    SKIP_DIRS = {"node_modules", ".git", "__pycache__", "venv", ".venv", "dist", "build", ".next"}
    results = []

    for path in repo_dir.rglob("*"):
        if not path.is_file():
            continue
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        result = parse_file(path)
        if result and result["symbols"]:
            results.append({
                "file_path": str(path.relative_to(repo_dir)),
                "language": result["language"],
                "symbols": result["symbols"],
            })

    return results