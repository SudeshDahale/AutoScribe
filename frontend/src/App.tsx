import { useState, useEffect, useRef } from "react";
import "./App.css";

const API = "http://localhost:8000/api/v1";

interface User {
  username: string;
  avatar_url: string;
  user_id: number;
  access_token: string;
}

interface Repo {
  id: number;
  full_name: string;
  repo_name: string;
  github_url: string;
  description: string;
  default_branch: string;
  stars: number;
  language: string;
  last_pushed_at: string;
  created_at: string;
}

interface Symbol {
  type: string;
  name: string;
  line: number;
  docstring: string;
}

interface ParsedFile {
  file_path: string;
  language: string;
  symbols: Symbol[];
}

interface Docstring {
  name: string;
  type: string;
  docstring: string;
}

interface SearchResult {
  name: string;
  type: string;
  file_path: string;
  language: string;
  line: number;
  docstring: string;
  score: number;
}

interface IndexStats {
  indexed: boolean;
  symbol_count: number;
}

type RightPanel = "empty" | "parse" | "readme" | "docstrings" | "search";

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const LANG_ICON: Record<string, string> = { python: "🐍", javascript: "🟨", typescript: "🔷", tsx: "🔷" };
const SYMBOL_ICON: Record<string, string> = { function: "ƒ", class: "◆", method: "∷", interface: "⬡", type: "τ" };

function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="markdown-body">
      {lines.map((line, i) => {
        if (line.startsWith("# ")) return <h1 key={i}>{line.slice(2)}</h1>;
        if (line.startsWith("## ")) return <h2 key={i}>{line.slice(3)}</h2>;
        if (line.startsWith("### ")) return <h3 key={i}>{line.slice(4)}</h3>;
        if (line.startsWith("- ") || line.startsWith("* ")) return <li key={i}>{line.slice(2)}</li>;
        if (line.startsWith("```")) return <div key={i} className="code-fence-marker" />;
        if (line.trim() === "") return <br key={i} />;
        return <p key={i}>{line}</p>;
      })}
    </div>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [repoInput, setRepoInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseResults, setParseResults] = useState<ParsedFile[]>([]);
  const [parseError, setParseError] = useState("");
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  const [rightPanel, setRightPanel] = useState<RightPanel>("empty");
  const [readme, setReadme] = useState("");
  const [generatingReadme, setGeneratingReadme] = useState(false);
  const [readmeError, setReadmeError] = useState("");
  const [copied, setCopied] = useState(false);

  const [docstringsFile, setDocstringsFile] = useState<string>("");
  const [docstrings, setDocstrings] = useState<Docstring[]>([]);
  const [generatingDocstrings, setGeneratingDocstrings] = useState(false);
  const [docstringsError, setDocstringsError] = useState("");

  // ── Search + RAG state ──────────────────────────────────────────────────
  const [indexStats, setIndexStats] = useState<IndexStats | null>(null);
  const [indexing, setIndexing] = useState(false);
  const [indexError, setIndexError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchError, setSearchError] = useState("");

  const [ragQuestion, setRagQuestion] = useState("");
  const [ragAsking, setRagAsking] = useState(false);
  const [ragAnswer, setRagAnswer] = useState("");
  const [ragSources, setRagSources] = useState<SearchResult[]>([]);
  const [ragError, setRagError] = useState("");

  const [searchMode, setSearchMode] = useState<"search" | "ask">("search");
  // ────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("access_token");
    const username = params.get("username");
    const avatar_url = params.get("avatar_url");
    const user_id = params.get("user_id");
    if (token && username && avatar_url && user_id) {
      const userData = { access_token: token, username, avatar_url, user_id: parseInt(user_id) };
      setUser(userData);
      localStorage.setItem("autoscribe_user", JSON.stringify(userData));
      window.history.replaceState({}, "", "/");
    } else {
      const saved = localStorage.getItem("autoscribe_user");
      if (saved) setUser(JSON.parse(saved));
    }
  }, []);

  useEffect(() => { if (user) fetchRepos(); }, [user]);

  async function fetchRepos() {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/repos/`, { headers: { Authorization: `Bearer ${user.access_token}` } });
      if (!res.ok) throw new Error();
      setRepos(await res.json());
    } catch { setError("Could not load repositories."); }
    finally { setLoading(false); }
  }

  async function handleAddRepo(e: React.FormEvent) {
    e.preventDefault();
    if (!repoInput.trim() || !user) return;
    setAdding(true); setError("");
    try {
      const res = await fetch(`${API}/repos/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.access_token}` },
        body: JSON.stringify({ repo_url: repoInput.trim() }),
      });
      if (res.status === 409) { setError("Repository already added."); return; }
      if (res.status === 404) { setError("GitHub repo not found."); return; }
      if (!res.ok) { setError("Failed to add repository."); return; }
      const newRepo: Repo = await res.json();
      setRepos((prev) => [newRepo, ...prev]);
      setRepoInput("");
    } catch { setError("Network error. Is the backend running?"); }
    finally { setAdding(false); }
  }

  async function handleDeleteRepo(id: number) {
    if (!user || !confirm("Remove this repository from AutoScribe?")) return;
    try {
      const res = await fetch(`${API}/repos/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${user.access_token}` } });
      if (!res.ok) throw new Error();
      setRepos((prev) => prev.filter((r) => r.id !== id));
      if (selectedRepo?.id === id) { setSelectedRepo(null); setParseResults([]); setRightPanel("empty"); }
    } catch { setError("Failed to remove repository."); }
  }

  async function handleParseRepo(repo: Repo) {
    if (!user) return;
    setSelectedRepo(repo); setParseResults([]); setParseError("");
    setReadme(""); setRightPanel("parse"); setParsing(true);
    try {
      const res = await fetch(`${API}/repos/${repo.id}/parse`, { method: "POST", headers: { Authorization: `Bearer ${user.access_token}` } });
      if (!res.ok) { setParseError("Parsing failed."); return; }
      const rr = await fetch(`${API}/repos/${repo.id}/parse`, { headers: { Authorization: `Bearer ${user.access_token}` } });
      if (!rr.ok) throw new Error();
      const data: ParsedFile[] = await rr.json();
      setParseResults(data.sort((a, b) => a.file_path.localeCompare(b.file_path)));
      setExpandedFiles(new Set());
    } catch { setParseError("Failed to fetch parse results."); }
    finally { setParsing(false); }
  }

  async function handleGenerateReadme() {
    if (!user || !selectedRepo) return;
    setGeneratingReadme(true); setReadmeError(""); setRightPanel("readme");
    try {
      const res = await fetch(`${API}/repos/${selectedRepo.id}/generate-readme`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user.access_token}` },
      });
      if (!res.ok) { setReadmeError("Failed to generate README. Is the repo parsed?"); return; }
      const data = await res.json();
      setReadme(data.content);
    } catch { setReadmeError("Network error generating README."); }
    finally { setGeneratingReadme(false); }
  }

  async function handleGenerateDocstrings(file: ParsedFile) {
    if (!user || !selectedRepo) return;
    setDocstringsFile(file.file_path); setDocstrings([]); setDocstringsError("");
    setGeneratingDocstrings(true); setRightPanel("docstrings");
    try {
      const res = await fetch(`${API}/repos/${selectedRepo.id}/generate-docstrings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.access_token}` },
        body: JSON.stringify({ file_path: file.file_path }),
      });
      if (!res.ok) { setDocstringsError("Failed to generate docstrings."); return; }
      const data = await res.json();
      setDocstrings(data.docstrings);
    } catch { setDocstringsError("Network error."); }
    finally { setGeneratingDocstrings(false); }
  }

  // ── Search + RAG handlers ────────────────────────────────────────────────

  async function handleOpenSearch(repo: Repo) {
    if (!user) return;
    setSelectedRepo(repo);
    setRightPanel("search");
    setSearchResults([]);
    setRagAnswer("");
    setRagSources([]);
    setIndexError("");
    // fetch index stats
    try {
      const res = await fetch(`${API}/repos/${repo.id}/index/stats`, {
        headers: { Authorization: `Bearer ${user.access_token}` },
      });
      if (res.ok) setIndexStats(await res.json());
    } catch { /* silently ignore */ }
  }

  async function handleIndexRepo() {
    if (!user || !selectedRepo) return;
    setIndexing(true); setIndexError("");
    try {
      const res = await fetch(`${API}/repos/${selectedRepo.id}/index`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user.access_token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        setIndexError(err.detail || "Indexing failed.");
        return;
      }
      const data = await res.json();
      setIndexStats({ indexed: true, symbol_count: data.symbol_count });
    } catch { setIndexError("Network error during indexing."); }
    finally { setIndexing(false); }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !selectedRepo || !searchQuery.trim()) return;
    setSearching(true); setSearchError(""); setSearchResults([]);
    try {
      const res = await fetch(`${API}/repos/${selectedRepo.id}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.access_token}` },
        body: JSON.stringify({ query: searchQuery.trim(), n_results: 8 }),
      });
      if (!res.ok) { setSearchError("Search failed."); return; }
      const data = await res.json();
      setSearchResults(data.results);
    } catch { setSearchError("Network error."); }
    finally { setSearching(false); }
  }

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !selectedRepo || !ragQuestion.trim()) return;
    setRagAsking(true); setRagError(""); setRagAnswer(""); setRagSources([]);
    try {
      const res = await fetch(`${API}/repos/${selectedRepo.id}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.access_token}` },
        body: JSON.stringify({ question: ragQuestion.trim() }),
      });
      if (!res.ok) { setRagError("Failed to get answer."); return; }
      const data = await res.json();
      setRagAnswer(data.answer);
      setRagSources(data.sources);
    } catch { setRagError("Network error."); }
    finally { setRagAsking(false); }
  }

  // ────────────────────────────────────────────────────────────────────────

  function toggleFile(path: string) {
    setExpandedFiles((prev) => { const n = new Set(prev); n.has(path) ? n.delete(path) : n.add(path); return n; });
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const handleLogin = () => { window.location.href = `${API}/auth/github/login`; };
  const handleLogout = () => {
    localStorage.removeItem("autoscribe_user");
    setUser(null); setRepos([]); setSelectedRepo(null); setParseResults([]); setRightPanel("empty");
  };

  if (!user) {
    return (
      <div className="app">
        <div className="login-box">
          <h1>AutoScribe</h1>
          <p>AI-powered documentation for your GitHub repos</p>
          <button onClick={handleLogin} className="github-btn">Login with GitHub</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="navbar">
        <h2>AutoScribe</h2>
        <div className="user-info">
          <img src={user.avatar_url} alt="avatar" width={32} height={32} />
          <span>{user.username}</span>
          <button onClick={handleLogout} className="btn-ghost">Logout</button>
        </div>
      </div>

      <div className="layout">
        {/* ── Left panel ── */}
        <div className="panel-left">
          <div className="section-header">
            <h3>Repositories</h3>
            <span className="repo-count">{repos.length} added</span>
          </div>

          <form onSubmit={handleAddRepo} className="add-repo-form">
            <input
              type="text" className="repo-input"
              placeholder="owner/repo or GitHub URL"
              value={repoInput} onChange={(e) => setRepoInput(e.target.value)} disabled={adding}
            />
            <button type="submit" className="btn-primary" disabled={adding || !repoInput.trim()}>
              {adding ? "Adding…" : "Add"}
            </button>
          </form>

          {error && <p className="error-msg">{error}</p>}

          {loading ? <p className="muted">Loading…</p> : repos.length === 0 ? (
            <div className="empty-state"><p className="muted">No repositories yet.</p></div>
          ) : (
            <ul className="repo-list">
              {repos.map((repo) => (
                <li key={repo.id} className={`repo-card ${selectedRepo?.id === repo.id ? "repo-card--active" : ""}`}>
                  <div className="repo-card-header">
                    <a href={repo.github_url} target="_blank" rel="noreferrer" className="repo-title">{repo.full_name}</a>
                    <button className="btn-danger-sm" onClick={() => handleDeleteRepo(repo.id)}>✕</button>
                  </div>
                  {repo.description && <p className="repo-description">{repo.description}</p>}
                  <div className="repo-meta">
                    <span className="meta-pill">⎇ {repo.default_branch}</span>
                    {repo.language && <span className="meta-pill">🔤 {repo.language}</span>}
                    <span className="meta-pill">⭐ {repo.stars.toLocaleString()}</span>
                    <span className="meta-pill muted">pushed {formatDate(repo.last_pushed_at)}</span>
                  </div>
                  <div className="repo-actions">
                    <button className="btn-action" onClick={() => handleParseRepo(repo)} disabled={parsing && selectedRepo?.id === repo.id}>
                      {parsing && selectedRepo?.id === repo.id ? "Parsing…" : "⚙ Parse"}
                    </button>
                    <button className="btn-action btn-action--ai" onClick={() => { setSelectedRepo(repo); handleGenerateReadme(); }}
                      disabled={generatingReadme}>
                      {generatingReadme && selectedRepo?.id === repo.id ? "Generating…" : "✨ README"}
                    </button>
                    <button className="btn-action btn-action--search" onClick={() => handleOpenSearch(repo)}>
                      🔍 Search
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Right panel ── */}
        <div className="panel-right">

          {selectedRepo && (
            <div className="tab-bar">
              <button className={`tab ${rightPanel === "parse" ? "tab--active" : ""}`} onClick={() => setRightPanel("parse")}>⚙ Structure</button>
              <button className={`tab ${rightPanel === "readme" ? "tab--active" : ""}`} onClick={() => setRightPanel("readme")}>📄 README</button>
              {docstringsFile && (
                <button className={`tab ${rightPanel === "docstrings" ? "tab--active" : ""}`} onClick={() => setRightPanel("docstrings")}>💬 Docstrings</button>
              )}
              <button className={`tab ${rightPanel === "search" ? "tab--active" : ""}`} onClick={() => setRightPanel("search")}>🔍 Search</button>
            </div>
          )}

          {rightPanel === "empty" && (
            <div className="empty-state centered">
              <p>Select a repo and click <strong>⚙ Parse</strong> to see its structure,<br />or <strong>✨ README</strong> to generate documentation.</p>
            </div>
          )}

          {rightPanel === "parse" && (
            parsing ? (
              <div className="empty-state centered"><div className="spinner" /><p className="muted">Parsing {selectedRepo?.full_name}…</p></div>
            ) : parseError ? (
              <p className="error-msg">{parseError}</p>
            ) : parseResults.length === 0 ? (
              <div className="empty-state centered"><p className="muted">No parseable files found.</p></div>
            ) : (
              <>
                <div className="parse-header">
                  <h3>{selectedRepo?.full_name}</h3>
                  <span className="repo-count">{parseResults.length} files · {parseResults.reduce((a, f) => a + f.symbols.length, 0)} symbols</span>
                </div>
                <ul className="file-list">
                  {parseResults.map((file) => (
                    <li key={file.file_path} className="file-item">
                      <div className="file-toggle-row">
                        <button className="file-toggle" onClick={() => toggleFile(file.file_path)}>
                          <span className="lang-icon">{LANG_ICON[file.language] ?? "📄"}</span>
                          <span className="file-path">{file.file_path}</span>
                          <span className="symbol-count">{file.symbols.length} symbols</span>
                          <span className="chevron">{expandedFiles.has(file.file_path) ? "▾" : "▸"}</span>
                        </button>
                        <button className="btn-docstring" onClick={() => handleGenerateDocstrings(file)} title="Generate docstrings">
                          ✨
                        </button>
                      </div>
                      {expandedFiles.has(file.file_path) && (
                        <ul className="symbol-list">
                          {file.symbols.map((sym, i) => (
                            <li key={i} className="symbol-item">
                              <span className={`symbol-icon symbol-icon--${sym.type}`}>{SYMBOL_ICON[sym.type] ?? "·"}</span>
                              <span className="symbol-name">{sym.name}</span>
                              <span className="symbol-line">:{sym.line}</span>
                              {sym.docstring && <span className="symbol-doc">{sym.docstring.slice(0, 80)}{sym.docstring.length > 80 ? "…" : ""}</span>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )
          )}

          {rightPanel === "readme" && (
            <div className="readme-panel">
              <div className="readme-header">
                <h3>Generated README</h3>
                {readme && (
                  <button className="btn-copy" onClick={() => handleCopy(readme)}>
                    {copied ? "✓ Copied!" : "Copy Markdown"}
                  </button>
                )}
              </div>
              {generatingReadme ? (
                <div className="empty-state centered"><div className="spinner" /><p className="muted">Generating README with AI…</p></div>
              ) : readmeError ? (
                <p className="error-msg">{readmeError}</p>
              ) : readme ? (
                <MarkdownRenderer content={readme} />
              ) : (
                <div className="empty-state centered">
                  <p className="muted">Click <strong>✨ README</strong> on a repo to generate documentation.</p>
                </div>
              )}
            </div>
          )}

          {rightPanel === "docstrings" && (
            <div className="docstrings-panel">
              <div className="readme-header">
                <h3>Docstrings — <span className="muted">{docstringsFile}</span></h3>
              </div>
              {generatingDocstrings ? (
                <div className="empty-state centered"><div className="spinner" /><p className="muted">Generating docstrings with AI…</p></div>
              ) : docstringsError ? (
                <p className="error-msg">{docstringsError}</p>
              ) : docstrings.length === 0 ? (
                <div className="empty-state centered"><p className="muted">No docstrings generated.</p></div>
              ) : (
                <ul className="docstring-list">
                  {docstrings.map((d, i) => (
                    <li key={i} className="docstring-item">
                      <div className="docstring-header">
                        <span className={`symbol-icon symbol-icon--${d.type}`}>{SYMBOL_ICON[d.type] ?? "·"}</span>
                        <span className="symbol-name">{d.name}</span>
                        <span className="meta-pill">{d.type}</span>
                        <button className="btn-copy-sm" onClick={() => handleCopy(d.docstring)}>Copy</button>
                      </div>
                      <p className="docstring-text">{d.docstring}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ── Search + RAG Panel ── */}
          {rightPanel === "search" && (
            <div className="search-panel">
              <div className="search-panel-header">
                <h3>🔍 Semantic Search + RAG</h3>
                <span className="muted" style={{ fontSize: 13 }}>{selectedRepo?.full_name}</span>
              </div>

              {/* Index status bar */}
              <div className="index-bar">
                {indexStats?.indexed ? (
                  <span className="index-badge index-badge--ok">
                    ✅ Indexed — {indexStats.symbol_count} symbols
                  </span>
                ) : (
                  <span className="index-badge index-badge--warn">
                    ⚠ Not indexed yet
                  </span>
                )}
                <button
                  className="btn-action btn-action--ai"
                  onClick={handleIndexRepo}
                  disabled={indexing}
                  style={{ marginLeft: "auto" }}
                >
                  {indexing ? "Indexing…" : "⚡ Index Repo"}
                </button>
              </div>
              {indexError && <p className="error-msg">{indexError}</p>}

              {/* Mode toggle */}
              <div className="search-mode-toggle">
                <button
                  className={`mode-btn ${searchMode === "search" ? "mode-btn--active" : ""}`}
                  onClick={() => setSearchMode("search")}
                >
                  🔎 Semantic Search
                </button>
                <button
                  className={`mode-btn ${searchMode === "ask" ? "mode-btn--active" : ""}`}
                  onClick={() => setSearchMode("ask")}
                >
                  🤖 Ask AI (RAG)
                </button>
              </div>

              {/* Semantic Search */}
              {searchMode === "search" && (
                <div className="search-section">
                  <form onSubmit={handleSearch} className="search-form">
                    <input
                      className="repo-input"
                      placeholder="e.g. function that handles authentication"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      disabled={searching}
                    />
                    <button type="submit" className="btn-primary" disabled={searching || !searchQuery.trim()}>
                      {searching ? "…" : "Search"}
                    </button>
                  </form>

                  {searchError && <p className="error-msg">{searchError}</p>}

                  {searching && (
                    <div className="empty-state centered"><div className="spinner" /><p className="muted">Searching…</p></div>
                  )}

                  {searchResults.length > 0 && (
                    <ul className="search-results">
                      {searchResults.map((r, i) => (
                        <li key={i} className="search-result-item">
                          <div className="search-result-header">
                            <span className={`symbol-icon symbol-icon--${r.type}`}>{SYMBOL_ICON[r.type] ?? "·"}</span>
                            <span className="symbol-name">{r.name}</span>
                            <span className="meta-pill">{r.type}</span>
                            <span className="score-badge">{(r.score * 100).toFixed(0)}% match</span>
                          </div>
                          <div className="search-result-meta">
                            <span className="file-path-sm">{r.file_path}:{r.line}</span>
                            <span className="lang-icon">{LANG_ICON[r.language] ?? "📄"}</span>
                          </div>
                          {r.docstring && (
                            <p className="search-result-doc">{r.docstring.slice(0, 150)}{r.docstring.length > 150 ? "…" : ""}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  {!searching && searchResults.length === 0 && searchQuery && (
                    <p className="muted" style={{ marginTop: 16 }}>No results. Make sure the repo is indexed first.</p>
                  )}
                </div>
              )}

              {/* RAG Q&A */}
              {searchMode === "ask" && (
                <div className="search-section">
                  <form onSubmit={handleAsk} className="search-form">
                    <input
                      className="repo-input"
                      placeholder="e.g. What does the parse_repo function do?"
                      value={ragQuestion}
                      onChange={(e) => setRagQuestion(e.target.value)}
                      disabled={ragAsking}
                    />
                    <button type="submit" className="btn-primary" disabled={ragAsking || !ragQuestion.trim()}>
                      {ragAsking ? "…" : "Ask"}
                    </button>
                  </form>

                  {ragError && <p className="error-msg">{ragError}</p>}

                  {ragAsking && (
                    <div className="empty-state centered"><div className="spinner" /><p className="muted">Thinking…</p></div>
                  )}

                  {ragAnswer && (
                    <div className="rag-answer-block">
                      <div className="rag-answer-label">🤖 Answer</div>
                      <p className="rag-answer-text">{ragAnswer}</p>
                    </div>
                  )}

                  {ragSources.length > 0 && (
                    <div className="rag-sources">
                      <div className="rag-sources-label">📎 Sources used ({ragSources.length})</div>
                      <ul className="search-results">
                        {ragSources.map((r, i) => (
                          <li key={i} className="search-result-item search-result-item--sm">
                            <div className="search-result-header">
                              <span className={`symbol-icon symbol-icon--${r.type}`}>{SYMBOL_ICON[r.type] ?? "·"}</span>
                              <span className="symbol-name">{r.name}</span>
                              <span className="meta-pill">{r.type}</span>
                              <span className="score-badge">{(r.score * 100).toFixed(0)}%</span>
                            </div>
                            <div className="search-result-meta">
                              <span className="file-path-sm">{r.file_path}:{r.line}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;