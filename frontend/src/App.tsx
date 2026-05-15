import { useState, useEffect } from "react";
import "./App.css";

const API = "http://localhost:8000/api/v1";

// ── Types ────────────────────────────────────────────────────────────────────

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

interface StalenessReport {
  is_stale: boolean;
  stale_files: string[];
  total_files: number;
  stale_count: number;
}

type RightPanel = "empty" | "parse" | "readme" | "docstrings" | "search" | "staleness";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

const LANG_COLOR: Record<string, string> = {
  python: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  javascript: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  typescript: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  tsx: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
};
const LANG_ICON: Record<string, string> = {
  python: "🐍", javascript: "🟨", typescript: "🔷", tsx: "🔷",
};
const SYMBOL_ICON: Record<string, string> = {
  function: "ƒ", class: "◆", method: "∷", interface: "⬡", type: "τ",
};
const SYMBOL_COLOR: Record<string, string> = {
  function: "text-purple-500", class: "text-blue-500",
  method: "text-green-500", interface: "text-orange-500", type: "text-pink-500",
};

// ── Reusable mini-components ─────────────────────────────────────────────────

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12">
      <div className="spinner" />
      {label && <p className="text-sm text-gray-400">{label}</p>}
    </div>
  );
}

function EmptyState({ icon, title, sub }: { icon?: string; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      {icon && <span className="text-4xl">{icon}</span>}
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
    </div>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
      <span>⚠</span> {msg}
    </div>
  );
}

function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      {lines.map((line, i) => {
        if (line.startsWith("# ")) return <h1 key={i} className="text-2xl font-bold mt-6 mb-3 text-gray-900 dark:text-gray-100">{line.slice(2)}</h1>;
        if (line.startsWith("## ")) return <h2 key={i} className="text-lg font-semibold mt-5 mb-2 text-gray-800 dark:text-gray-200">{line.slice(3)}</h2>;
        if (line.startsWith("### ")) return <h3 key={i} className="text-base font-semibold mt-4 mb-1 text-gray-700 dark:text-gray-300">{line.slice(4)}</h3>;
        if (line.startsWith("- ") || line.startsWith("* ")) return <li key={i} className="ml-5 list-disc text-sm">{line.slice(2)}</li>;
        if (line.startsWith("```")) return <div key={i} className="border-t border-dashed border-gray-200 dark:border-gray-700 my-3" />;
        if (line.trim() === "") return <div key={i} className="h-3" />;
        return <p key={i} className="text-sm leading-relaxed">{line}</p>;
      })}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub }: { icon: string; label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 flex items-start gap-3 shadow-sm">
      <div className="w-10 h-10 rounded-lg bg-accent-light flex items-center justify-center text-xl flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [repoInput, setRepoInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  const [docstringsFile, setDocstringsFile] = useState("");
  const [docstrings, setDocstrings] = useState<Docstring[]>([]);
  const [generatingDocstrings, setGeneratingDocstrings] = useState(false);
  const [docstringsError, setDocstringsError] = useState("");

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

  const [stalenessReport, setStalenessReport] = useState<StalenessReport | null>(null);
  const [checkingStale, setCheckingStale] = useState(false);
  const [stalenessError, setStalenessError] = useState("");
  const [updatingDocs, setUpdatingDocs] = useState(false);

  // ── Auth ────────────────────────────────────────────────────────────────────

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

  // ── API Handlers ─────────────────────────────────────────────────────────────

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
        method: "POST", headers: { Authorization: `Bearer ${user.access_token}` },
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

  async function handleOpenSearch(repo: Repo) {
    if (!user) return;
    setSelectedRepo(repo); setRightPanel("search");
    setSearchResults([]); setRagAnswer(""); setRagSources([]); setIndexError("");
    try {
      const res = await fetch(`${API}/repos/${repo.id}/index/stats`, { headers: { Authorization: `Bearer ${user.access_token}` } });
      if (res.ok) setIndexStats(await res.json());
    } catch { /* silent */ }
  }

  async function handleIndexRepo() {
    if (!user || !selectedRepo) return;
    setIndexing(true); setIndexError("");
    try {
      const res = await fetch(`${API}/repos/${selectedRepo.id}/index`, {
        method: "POST", headers: { Authorization: `Bearer ${user.access_token}` },
      });
      if (!res.ok) { const err = await res.json(); setIndexError(err.detail || "Indexing failed."); return; }
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
      setRagAnswer(data.answer); setRagSources(data.sources);
    } catch { setRagError("Network error."); }
    finally { setRagAsking(false); }
  }

  async function handleCheckStaleness(repo: Repo) {
    if (!user) return;
    setSelectedRepo(repo); setRightPanel("staleness");
    setStalenessReport(null); setCheckingStale(true); setStalenessError("");
    try {
      const res = await fetch(`${API}/repos/${repo.id}/staleness`, { headers: { Authorization: `Bearer ${user.access_token}` } });
      if (!res.ok) { setStalenessError("Failed to check staleness."); return; }
      setStalenessReport(await res.json());
    } catch { setStalenessError("Network error."); }
    finally { setCheckingStale(false); }
  }

  async function handleIncrementalUpdate(updateType: "docstrings" | "readme" | "all") {
    if (!user || !selectedRepo) return;
    setUpdatingDocs(true);
    try {
      await fetch(`${API}/repos/${selectedRepo.id}/update-incremental`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.access_token}` },
        body: JSON.stringify({ update_type: updateType }),
      });
      await handleCheckStaleness(selectedRepo);
    } catch { /* silent */ }
    finally { setUpdatingDocs(false); }
  }

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

  // ── Dashboard stats ───────────────────────────────────────────────────────────

  const totalSymbols = parseResults.reduce((a, f) => a + f.symbols.length, 0);
  const totalStars = repos.reduce((a, r) => a + r.stars, 0);
  const languages = [...new Set(repos.map((r) => r.language).filter(Boolean))];

  // ── Login screen ──────────────────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        <div className="w-full max-w-sm mx-4">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent-light flex items-center justify-center text-3xl mx-auto mb-6">
              📝
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">AutoScribe</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
              AI-powered documentation for your GitHub repos
            </p>
            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-3 text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              Login with GitHub
            </button>
            <p className="text-xs text-gray-400 mt-6">Free · No credit card required</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Dashboard ────────────────────────────────────────────────────────────

  const tabs: { id: RightPanel; label: string; icon: string }[] = [
    { id: "parse", label: "Structure", icon: "⚙" },
    { id: "readme", label: "README", icon: "📄" },
    ...(docstringsFile ? [{ id: "docstrings" as RightPanel, label: "Docstrings", icon: "💬" }] : []),
    { id: "search", label: "Search", icon: "🔍" },
    { id: "staleness", label: "Health", icon: "🩺" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-[#16171d]">

      {/* ── Topbar ── */}
      <header className="h-14 flex items-center justify-between px-5 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500"
          >
            ☰
          </button>
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">AutoScribe</span>
          <Badge className="bg-accent-light text-accent text-[10px]">Beta</Badge>
        </div>
        <div className="flex items-center gap-3">
          <img src={user.avatar_url} alt="avatar" className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-700" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">{user.username}</span>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ── */}
        <aside className={`${sidebarOpen ? "w-80" : "w-0"} flex-shrink-0 transition-all duration-200 overflow-hidden border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col`}>
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Repositories</h2>
              <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-500">{repos.length}</Badge>
            </div>
            <form onSubmit={handleAddRepo} className="flex gap-2">
              <input
                type="text"
                placeholder="owner/repo"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                disabled={adding}
                className="flex-1 min-w-0 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
              />
              <button
                type="submit"
                disabled={adding || !repoInput.trim()}
                className="flex-shrink-0 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 hover:bg-purple-600 transition-colors"
              >
                {adding ? "…" : "Add"}
              </button>
            </form>
            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
            {loading ? (
              <Spinner label="Loading repos…" />
            ) : repos.length === 0 ? (
              <EmptyState icon="📁" title="No repos yet" sub="Add a GitHub repo above" />
            ) : repos.map((repo) => (
              <div
                key={repo.id}
                className={`rounded-xl border p-3 cursor-pointer transition-all group ${
                  selectedRepo?.id === repo.id
                    ? "border-accent bg-accent-light"
                    : "border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
                onClick={() => setSelectedRepo(repo)}
              >
                <div className="flex items-start justify-between gap-2">
  <a
    href={repo.github_url}
    target="_blank"
    rel="noreferrer"
    onClick={(e) => e.stopPropagation()}
    className="text-sm font-semibold text-gray-800 dark:text-gray-200 hover:text-accent truncate"
  >
    {repo.full_name}
  </a>

  <button
    onClick={(e) => {
      e.stopPropagation();
      handleDeleteRepo(repo.id);
    }}
    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all text-xs flex-shrink-0"
  >
    ✕
  </button>
</div>
                {repo.description && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{repo.description}</p>
                )}
                <div className="flex flex-wrap gap-1 mt-2">
                  {repo.language && (
                    <Badge className={LANG_COLOR[repo.language.toLowerCase()] ?? "bg-gray-100 text-gray-500"}>
                      {LANG_ICON[repo.language.toLowerCase()] ?? "🔤"} {repo.language}
                    </Badge>
                  )}
                  <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-500">⭐ {repo.stars.toLocaleString()}</Badge>
                </div>
                {/* Action buttons */}
                <div className="flex gap-1.5 mt-2.5 flex-wrap">
                  {[
                    { label: "⚙ Parse", action: () => handleParseRepo(repo), loading: parsing && selectedRepo?.id === repo.id },
                    { label: "✨ README", action: () => { setSelectedRepo(repo); handleGenerateReadme(); }, loading: generatingReadme && selectedRepo?.id === repo.id },
                    { label: "🔍 Search", action: () => handleOpenSearch(repo), loading: false },
                    { label: "🩺 Health", action: () => handleCheckStaleness(repo), loading: checkingStale && selectedRepo?.id === repo.id },
                  ].map(({ label, action, loading: btnLoading }) => (
                    <button
                      key={label}
                      onClick={(e) => { e.stopPropagation(); action(); }}
                      disabled={btnLoading}
                      className="text-[11px] font-medium px-2 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
                    >
                      {btnLoading ? "…" : label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ── Main area ── */}
        <main className="flex-1 flex flex-col overflow-hidden">

          {/* Stats strip */}
          {repos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <StatCard icon="📦" label="Repos" value={repos.length} />
              <StatCard icon="⭐" label="Total Stars" value={totalStars.toLocaleString()} />
              <StatCard icon="🔣" label="Symbols Parsed" value={totalSymbols} sub={selectedRepo?.full_name ?? "select a repo"} />
              <StatCard icon="🌐" label="Languages" value={languages.length} sub={languages.slice(0, 3).join(", ")} />
            </div>
          )}

          {/* Tab bar */}
          {selectedRepo && (
            <div className="flex items-center gap-1 px-4 pt-3 pb-0 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="flex items-center gap-1 text-xs text-gray-400 mr-3 flex-shrink-0">
                <span>📂</span>
                <span className="font-medium text-gray-600 dark:text-gray-400">{selectedRepo.full_name}</span>
              </div>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setRightPanel(tab.id)}
                  className={`px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
                    rightPanel === tab.id
                      ? "border-accent text-accent"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-6">

            {/* Empty */}
            {rightPanel === "empty" && (
              <EmptyState
                icon="🚀"
                title="Select a repository to get started"
                sub="Add a GitHub repo from the sidebar, then Parse it or generate a README."
              />
            )}

            {/* ── Structure Panel ── */}
            {rightPanel === "parse" && (
              parsing ? <Spinner label={`Parsing ${selectedRepo?.full_name}…`} /> :
              parseError ? <ErrorMsg msg={parseError} /> :
              parseResults.length === 0 ? (
                <EmptyState icon="📂" title="No parseable files found" sub="Try adding a repo with Python or TypeScript files." />
              ) : (
                <div className="max-w-3xl space-y-2">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Code Structure</h2>
                    <div className="flex gap-2">
                      <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">{parseResults.length} files</Badge>
                      <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">{totalSymbols} symbols</Badge>
                    </div>
                  </div>
                  {parseResults.map((file) => (
                    <div key={file.file_path} className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
                        <button
                          className="flex items-center gap-2 flex-1 text-left min-w-0"
                          onClick={() => toggleFile(file.file_path)}
                        >
                          <span className="text-base">{LANG_ICON[file.language] ?? "📄"}</span>
                          <span className="text-sm font-mono text-gray-700 dark:text-gray-300 truncate">{file.file_path}</span>
                          <Badge className="bg-gray-200 dark:bg-gray-700 text-gray-500 ml-auto flex-shrink-0">{file.symbols.length}</Badge>
                          <span className="text-gray-400 flex-shrink-0 ml-1">{expandedFiles.has(file.file_path) ? "▾" : "▸"}</span>
                        </button>
                        <button
                          onClick={() => handleGenerateDocstrings(file)}
                          className="ml-3 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:border-accent hover:text-accent transition-colors flex-shrink-0"
                        >
                          ✨ Docstrings
                        </button>
                      </div>
                      {expandedFiles.has(file.file_path) && (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                          {file.symbols.map((sym, i) => (
                            <div key={i} className="flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                              <span className={`font-mono text-sm font-bold flex-shrink-0 mt-0.5 ${SYMBOL_COLOR[sym.type] ?? "text-gray-400"}`}>
                                {SYMBOL_ICON[sym.type] ?? "·"}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 font-mono">{sym.name}</span>
                                  <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-400 text-[10px]">{sym.type}</Badge>
                                  <span className="text-xs text-gray-400 font-mono">:{sym.line}</span>
                                </div>
                                {sym.docstring && (
                                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{sym.docstring}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ── README Panel ── */}
            {rightPanel === "readme" && (
              <div className="max-w-3xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Generated README</h2>
                  {readme && (
                    <button
                      onClick={() => handleCopy(readme)}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-accent hover:text-accent transition-colors"
                    >
                      {copied ? "✓ Copied!" : "Copy Markdown"}
                    </button>
                  )}
                </div>
                {generatingReadme ? <Spinner label="Generating README with AI…" /> :
                 readmeError ? <ErrorMsg msg={readmeError} /> :
                 readme ? (
                  <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
                    <MarkdownRenderer content={readme} />
                  </div>
                 ) : (
                  <EmptyState icon="📄" title="No README yet" sub="Click ✨ README on a repo to generate documentation." />
                 )}
              </div>
            )}

            {/* ── Docstrings Panel ── */}
            {rightPanel === "docstrings" && (
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Docstrings</h2>
                  <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-500">{docstringsFile}</code>
                </div>
                {generatingDocstrings ? <Spinner label="Generating docstrings with AI…" /> :
                 docstringsError ? <ErrorMsg msg={docstringsError} /> :
                 docstrings.length === 0 ? <EmptyState icon="💬" title="No docstrings generated yet" /> : (
                  <div className="space-y-3">
                    {docstrings.map((d, i) => (
                      <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`font-mono text-sm font-bold ${SYMBOL_COLOR[d.type] ?? "text-gray-400"}`}>{SYMBOL_ICON[d.type] ?? "·"}</span>
                          <span className="text-sm font-semibold font-mono text-gray-800 dark:text-gray-200">{d.name}</span>
                          <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-400">{d.type}</Badge>
                          <button
                            onClick={() => handleCopy(d.docstring)}
                            className="ml-auto text-xs text-gray-400 hover:text-accent transition-colors"
                          >
                            Copy
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{d.docstring}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Search Panel ── */}
            {rightPanel === "search" && (
              <div className="max-w-3xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Semantic Search + RAG</h2>
                  <div className="flex items-center gap-2">
                    {indexStats?.indexed ? (
                      <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                        ✅ Indexed · {indexStats.symbol_count} symbols
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                        ⚠ Not indexed
                      </Badge>
                    )}
                    <button
                      onClick={handleIndexRepo}
                      disabled={indexing}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-accent text-white hover:bg-purple-600 disabled:opacity-50 transition-colors"
                    >
                      {indexing ? "Indexing…" : "⚡ Index"}
                    </button>
                  </div>
                </div>

                {indexError && <ErrorMsg msg={indexError} />}

                {/* Mode toggle */}
                <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800 mb-4 w-fit">
                  {(["search", "ask"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setSearchMode(mode)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        searchMode === mode
                          ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                          : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      }`}
                    >
                      {mode === "search" ? "🔎 Search" : "🤖 Ask AI"}
                    </button>
                  ))}
                </div>

                {searchMode === "search" && (
                  <>
                    <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                      <input
                        className="flex-1 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
                        placeholder="e.g. function that handles authentication"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        disabled={searching}
                      />
                      <button
                        type="submit"
                        disabled={searching || !searchQuery.trim()}
                        className="px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-medium disabled:opacity-50 hover:bg-purple-600 transition-colors"
                      >
                        {searching ? "…" : "Search"}
                      </button>
                    </form>
                    {searchError && <ErrorMsg msg={searchError} />}
                    {searching && <Spinner label="Searching…" />}
                    {searchResults.length > 0 && (
                      <div className="space-y-2">
                        {searchResults.map((r, i) => (
                          <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`font-mono text-sm font-bold ${SYMBOL_COLOR[r.type] ?? "text-gray-400"}`}>{SYMBOL_ICON[r.type] ?? "·"}</span>
                              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{r.name}</span>
                              <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-400">{r.type}</Badge>
                              <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 ml-auto">
                                {(r.score * 100).toFixed(0)}% match
                              </Badge>
                            </div>
                            <p className="text-xs font-mono text-gray-400 mb-2">{r.file_path}:{r.line}</p>
                            {r.docstring && <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{r.docstring}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                    {!searching && searchResults.length === 0 && searchQuery && (
                      <p className="text-sm text-gray-400 text-center mt-8">No results. Make sure the repo is indexed first.</p>
                    )}
                  </>
                )}

                {searchMode === "ask" && (
                  <>
                    <form onSubmit={handleAsk} className="flex gap-2 mb-4">
                      <input
                        className="flex-1 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
                        placeholder="e.g. What does the parse_repo function do?"
                        value={ragQuestion}
                        onChange={(e) => setRagQuestion(e.target.value)}
                        disabled={ragAsking}
                      />
                      <button
                        type="submit"
                        disabled={ragAsking || !ragQuestion.trim()}
                        className="px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-medium disabled:opacity-50 hover:bg-purple-600 transition-colors"
                      >
                        {ragAsking ? "…" : "Ask"}
                      </button>
                    </form>
                    {ragError && <ErrorMsg msg={ragError} />}
                    {ragAsking && <Spinner label="Thinking…" />}
                    {ragAnswer && (
                      <div className="rounded-xl border border-accent-border bg-accent-light p-5 mb-4">
                        <p className="text-xs font-semibold text-accent mb-2">🤖 Answer</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{ragAnswer}</p>
                      </div>
                    )}
                    {ragSources.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 mb-2">📎 Sources ({ragSources.length})</p>
                        <div className="space-y-1.5">
                          {ragSources.map((r, i) => (
                            <div key={i} className="flex items-center gap-2 rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2">
                              <span className={`font-mono text-xs font-bold ${SYMBOL_COLOR[r.type] ?? "text-gray-400"}`}>{SYMBOL_ICON[r.type] ?? "·"}</span>
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{r.name}</span>
                              <span className="text-xs text-gray-400 font-mono">{r.file_path}:{r.line}</span>
                              <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-400 ml-auto">{(r.score * 100).toFixed(0)}%</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── Health / Staleness Panel ── */}
            {rightPanel === "staleness" && (
              <div className="max-w-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Documentation Health</h2>
                  <span className="text-xs text-gray-400">{selectedRepo?.full_name}</span>
                </div>
                {checkingStale ? <Spinner label="Checking staleness…" /> :
                 stalenessError ? <ErrorMsg msg={stalenessError} /> :
                 !stalenessReport ? (
                  <EmptyState icon="🩺" title="Click 🩺 Health on a repo to check" />
                 ) : (
                  <div className="space-y-4">
                    {/* Summary card */}
                    <div className={`rounded-2xl border p-5 ${stalenessReport.is_stale ? "border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20" : "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{stalenessReport.is_stale ? "⚠️" : "✅"}</span>
                        <div>
                          <p className={`text-base font-bold ${stalenessReport.is_stale ? "text-yellow-800 dark:text-yellow-300" : "text-green-800 dark:text-green-300"}`}>
                            {stalenessReport.is_stale ? "Documentation is stale" : "Documentation is up to date"}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {stalenessReport.stale_count} of {stalenessReport.total_files} files need updating
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Stale files */}
                    {stalenessReport.stale_files.length > 0 && (
                      <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Stale Files</p>
                          <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700">{stalenessReport.stale_files.length}</Badge>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                          {stalenessReport.stale_files.map((f, i) => (
                            <div key={i} className="px-4 py-2.5 flex items-center gap-2">
                              <span className="text-yellow-500 text-xs">●</span>
                              <code className="text-xs text-gray-600 dark:text-gray-400">{f}</code>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Update buttons */}
                    {stalenessReport.is_stale && (
                      <div className="flex flex-wrap gap-2">
                        {(["docstrings", "readme", "all"] as const).map((type) => (
                          <button
                            key={type}
                            onClick={() => handleIncrementalUpdate(type)}
                            disabled={updatingDocs}
                            className="text-sm font-medium px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-accent hover:text-accent disabled:opacity-50 transition-colors"
                          >
                            {updatingDocs ? "Updating…" : `Update ${type}`}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

export default App;