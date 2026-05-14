import { useState, useEffect } from "react";
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

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

const LANG_ICON: Record<string, string> = {
  python: "🐍", javascript: "🟨", typescript: "🔷", tsx: "🔷",
};

const SYMBOL_ICON: Record<string, string> = {
  function: "ƒ", class: "◆", method: "∷", interface: "⬡", type: "τ",
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [repoInput, setRepoInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  // parse state
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseResults, setParseResults] = useState<ParsedFile[]>([]);
  const [parseError, setParseError] = useState("");
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

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
      const res = await fetch(`${API}/repos/`, {
        headers: { Authorization: `Bearer ${user.access_token}` },
      });
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
      const res = await fetch(`${API}/repos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.access_token}` },
      });
      if (!res.ok) throw new Error();
      setRepos((prev) => prev.filter((r) => r.id !== id));
      if (selectedRepo?.id === id) { setSelectedRepo(null); setParseResults([]); }
    } catch { setError("Failed to remove repository."); }
  }

  async function handleParseRepo(repo: Repo) {
    if (!user) return;
    setSelectedRepo(repo);
    setParseResults([]);
    setParseError("");
    setParsing(true);
    try {
      // trigger parse
      const res = await fetch(`${API}/repos/${repo.id}/parse`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user.access_token}` },
      });
      if (!res.ok) { setParseError("Parsing failed. Check the backend logs."); return; }
      // fetch results
      const rr = await fetch(`${API}/repos/${repo.id}/parse`, {
        headers: { Authorization: `Bearer ${user.access_token}` },
      });
      if (!rr.ok) throw new Error();
      const data: ParsedFile[] = await rr.json();
      setParseResults(data.sort((a, b) => a.file_path.localeCompare(b.file_path)));
      setExpandedFiles(new Set());
    } catch { setParseError("Failed to fetch parse results."); }
    finally { setParsing(false); }
  }

  function toggleFile(path: string) {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  }

  const handleLogin = () => { window.location.href = `${API}/auth/github/login`; };
  const handleLogout = () => {
    localStorage.removeItem("autoscribe_user");
    setUser(null); setRepos([]); setSelectedRepo(null); setParseResults([]);
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
        {/* Left panel — repo list */}
        <div className="panel-left">
          <div className="section-header">
            <h3>Repositories</h3>
            <span className="repo-count">{repos.length} added</span>
          </div>

          <form onSubmit={handleAddRepo} className="add-repo-form">
            <input
              type="text"
              className="repo-input"
              placeholder="owner/repo or GitHub URL"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              disabled={adding}
            />
            <button type="submit" className="btn-primary" disabled={adding || !repoInput.trim()}>
              {adding ? "Adding…" : "Add"}
            </button>
          </form>

          {error && <p className="error-msg">{error}</p>}

          {loading ? (
            <p className="muted">Loading…</p>
          ) : repos.length === 0 ? (
            <div className="empty-state">
              <p className="muted">No repositories yet.</p>
            </div>
          ) : (
            <ul className="repo-list">
              {repos.map((repo) => (
                <li
                  key={repo.id}
                  className={`repo-card ${selectedRepo?.id === repo.id ? "repo-card--active" : ""}`}
                >
                  <div className="repo-card-header">
                    <a href={repo.github_url} target="_blank" rel="noreferrer" className="repo-title">
                      {repo.full_name}
                    </a>
                    <button className="btn-danger-sm" onClick={() => handleDeleteRepo(repo.id)} title="Remove">✕</button>
                  </div>

                  {repo.description && <p className="repo-description">{repo.description}</p>}

                  <div className="repo-meta">
                    <span className="meta-pill">⎇ {repo.default_branch}</span>
                    {repo.language && <span className="meta-pill">🔤 {repo.language}</span>}
                    <span className="meta-pill">⭐ {repo.stars.toLocaleString()}</span>
                    <span className="meta-pill muted">pushed {formatDate(repo.last_pushed_at)}</span>
                  </div>

                  <button
                    className="btn-parse"
                    onClick={() => handleParseRepo(repo)}
                    disabled={parsing && selectedRepo?.id === repo.id}
                  >
                    {parsing && selectedRepo?.id === repo.id ? "Parsing…" : "⚙ Parse Repo"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right panel — parse results */}
        <div className="panel-right">
          {!selectedRepo ? (
            <div className="empty-state centered">
              <p>Select a repo and click <strong>⚙ Parse Repo</strong> to see its structure.</p>
            </div>
          ) : parsing ? (
            <div className="empty-state centered">
              <div className="spinner" />
              <p className="muted">Fetching and parsing {selectedRepo.full_name}…</p>
            </div>
          ) : parseError ? (
            <p className="error-msg">{parseError}</p>
          ) : parseResults.length === 0 ? (
            <div className="empty-state centered">
              <p className="muted">No parseable files found.</p>
            </div>
          ) : (
            <>
              <div className="parse-header">
                <h3>{selectedRepo.full_name}</h3>
                <span className="repo-count">{parseResults.length} files · {parseResults.reduce((a, f) => a + f.symbols.length, 0)} symbols</span>
              </div>
              <ul className="file-list">
                {parseResults.map((file) => (
                  <li key={file.file_path} className="file-item">
                    <button className="file-toggle" onClick={() => toggleFile(file.file_path)}>
                      <span className="lang-icon">{LANG_ICON[file.language] ?? "📄"}</span>
                      <span className="file-path">{file.file_path}</span>
                      <span className="symbol-count">{file.symbols.length} symbols</span>
                      <span className="chevron">{expandedFiles.has(file.file_path) ? "▾" : "▸"}</span>
                    </button>

                    {expandedFiles.has(file.file_path) && (
                      <ul className="symbol-list">
                        {file.symbols.map((sym, i) => (
                          <li key={i} className="symbol-item">
                            <span className={`symbol-icon symbol-icon--${sym.type}`}>
                              {SYMBOL_ICON[sym.type] ?? "·"}
                            </span>
                            <span className="symbol-name">{sym.name}</span>
                            <span className="symbol-line">:{sym.line}</span>
                            {sym.docstring && (
                              <span className="symbol-doc">{sym.docstring.slice(0, 80)}{sym.docstring.length > 80 ? "…" : ""}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;