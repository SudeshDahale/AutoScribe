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

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [repoInput, setRepoInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("access_token");
    const username = params.get("username");
    const avatar_url = params.get("avatar_url");
    const user_id = params.get("user_id");

    if (token && username && avatar_url && user_id) {
      const userData = {
        access_token: token,
        username,
        avatar_url,
        user_id: parseInt(user_id),
      };
      setUser(userData);
      localStorage.setItem("autoscribe_user", JSON.stringify(userData));
      window.history.replaceState({}, "", "/");
    } else {
      const saved = localStorage.getItem("autoscribe_user");
      if (saved) setUser(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (user) fetchRepos();
  }, [user]);

  async function fetchRepos() {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/repos/`, {
        headers: { Authorization: `Bearer ${user.access_token}` },
      });
      if (!res.ok) throw new Error("Failed to load repos");
      setRepos(await res.json());
    } catch {
      setError("Could not load repositories.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddRepo(e: React.FormEvent) {
    e.preventDefault();
    if (!repoInput.trim() || !user) return;
    setAdding(true);
    setError("");
    try {
      const res = await fetch(`${API}/repos/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.access_token}`,
        },
        body: JSON.stringify({ repo_url: repoInput.trim() }),
      });
      if (res.status === 409) { setError("Repository already added."); return; }
      if (res.status === 404) { setError("GitHub repo not found. Check the URL or name."); return; }
      if (!res.ok) { setError("Failed to add repository."); return; }
      const newRepo: Repo = await res.json();
      setRepos((prev) => [newRepo, ...prev]);
      setRepoInput("");
    } catch {
      setError("Network error. Is the backend running?");
    } finally {
      setAdding(false);
    }
  }

  async function handleDeleteRepo(id: number) {
    if (!user) return;
    if (!confirm("Remove this repository from AutoScribe?")) return;
    try {
      const res = await fetch(`${API}/repos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.access_token}` },
      });
      if (!res.ok) throw new Error();
      setRepos((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError("Failed to remove repository.");
    }
  }

  const handleLogin = () => {
    window.location.href = `${API}/auth/github/login`;
  };

  const handleLogout = () => {
    localStorage.removeItem("autoscribe_user");
    setUser(null);
    setRepos([]);
  };

  if (!user) {
    return (
      <div className="app">
        <div className="login-box">
          <h1>AutoScribe</h1>
          <p>AI-powered documentation for your GitHub repos</p>
          <button onClick={handleLogin} className="github-btn">
            Login with GitHub
          </button>
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

      <div className="content">
        <div className="section-header">
          <h3>Repositories</h3>
          <span className="repo-count">{repos.length} added</span>
        </div>

        <form onSubmit={handleAddRepo} className="add-repo-form">
          <input
            type="text"
            className="repo-input"
            placeholder="owner/repo  or  https://github.com/owner/repo"
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            disabled={adding}
          />
          <button type="submit" className="btn-primary" disabled={adding || !repoInput.trim()}>
            {adding ? "Adding…" : "Add Repo"}
          </button>
        </form>

        {error && <p className="error-msg">{error}</p>}

        {loading ? (
          <p className="muted">Loading repositories…</p>
        ) : repos.length === 0 ? (
          <div className="empty-state">
            <p>No repositories yet.</p>
            <p className="muted">Paste a GitHub URL above to get started.</p>
          </div>
        ) : (
          <ul className="repo-list">
            {repos.map((repo) => (
              <li key={repo.id} className="repo-card">
                <div className="repo-card-header">
  <a
    href={repo.github_url}
    target="_blank"
    rel="noreferrer"
    className="repo-title"
  >
    {repo.full_name}
  </a>

  <button
    className="btn-danger-sm"
    onClick={() => handleDeleteRepo(repo.id)}
    title="Remove repo"
  >
    ✕
  </button>
</div>

                {repo.description && (
                  <p className="repo-description">{repo.description}</p>
                )}

                <div className="repo-meta">
                  <span className="meta-pill">⎇ {repo.default_branch}</span>
                  {repo.language && (
                    <span className="meta-pill">🔤 {repo.language}</span>
                  )}
                  <span className="meta-pill">⭐ {repo.stars.toLocaleString()}</span>
                  <span className="meta-pill muted">
                    pushed {formatDate(repo.last_pushed_at)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;