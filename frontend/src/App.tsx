import { useState, useEffect } from "react";
import "./App.css";

import { API } from "./constants";
import type {
  User, Repo, ParsedFile, Docstring, SearchResult,
  IndexStats, StalenessReport, Analytics, RepoHealth,
  WebhookStatus, PromptTemplate, EditHistoryEntry,
  ValidationResult, RightPanel,
} from "./types";

import { LoginPage } from "./components/LoginPage";
import { Topbar } from "./components/TopBar";
import { Sidebar } from "./components/Sidebar";
import { StatsStrip } from "./components/StatsStrip";
import { TabBar } from "./components/TabBar";
import { ParsePanel } from "./components/panels/ParsePanel";
import { ReadmePanel } from "./components/panels/ReadmePanel";
import { DocstringsPanel } from "./components/panels/DocstringsPanel";
import { SearchPanel } from "./components/panels/SearchPanel";
import { AnalyticsPanel } from "./components/panels/AnalyticsPanel";
import { StalenessPanel } from "./components/panels/StalenessPanel";
import { WebhookPanel } from "./components/panels/WebhookPanel";
import { PromptEditorModal } from "./components/PromptEditorModal";
import { EmptyState } from "./components/ui/EmptyState";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [repoInput, setRepoInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [healthScores, setHealthScores] = useState<Record<number, RepoHealth>>({});
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
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");
  const [webhookStatus, setWebhookStatus] = useState<WebhookStatus | null>(null);
  const [webhookSecret, setWebhookSecret] = useState("");
  const [webhookAutoRegen, setWebhookAutoRegen] = useState(true);
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [webhookSaved, setWebhookSaved] = useState<null | { webhook_url: string; instructions: Record<string, string> }>(null);
  const [webhookError, setWebhookError] = useState("");
  const [promptEditorOpen, setPromptEditorOpen] = useState(false);
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [activePrompt, setActivePrompt] = useState("");
  const [activeDocType, setActiveDocType] = useState("readme");
  const [promptValidation, setPromptValidation] = useState<ValidationResult | null>(null);
  const [previewContent, setPreviewContent] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [generatingWithPrompt, setGeneratingWithPrompt] = useState(false);
  const [promptGenError, setPromptGenError] = useState("");
  const [promptGenSuccess, setPromptGenSuccess] = useState("");
  const [editHistory, setEditHistory] = useState<EditHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [createPR, setCreatePR] = useState(false);
  const [promptTab, setPromptTab] = useState<"editor" | "preview" | "history">("editor");
  const [validating, setValidating] = useState(false);

  // Auth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("access_token");
    const username = params.get("username");
    const avatar_url = params.get("avatar_url");
    const user_id = params.get("user_id");
    if (token && username && avatar_url && user_id) {
      const u = { access_token: token, username, avatar_url, user_id: parseInt(user_id) };
      setUser(u);
      localStorage.setItem("autoscribe_user", JSON.stringify(u));
      window.history.replaceState({}, "", "/");
    } else {
      const saved = localStorage.getItem("autoscribe_user");
      if (saved) setUser(JSON.parse(saved));
    }
  }, []);

  useEffect(() => { if (user) fetchRepos(); }, [user]);
  useEffect(() => {
    if (!user || repos.length === 0) return;
    repos.forEach(loadHealthScore);
  }, [repos.length]);

  async function loadHealthScore(repo: Repo) {
    if (!user) return;
    setHealthScores(p => ({ ...p, [repo.id]: { repoId: repo.id, coverage_pct: null, stale_count: null, status: null, loading: true } }));
    try {
      const res = await fetch(`${API}/repos/${repo.id}/analytics`, { headers: { Authorization: `Bearer ${user.access_token}` } });
      if (res.ok) {
        const data: Analytics = await res.json();
        setHealthScores(p => ({ ...p, [repo.id]: { repoId: repo.id, coverage_pct: data.coverage_pct, stale_count: data.stale_count, status: data.status, loading: false } }));
      } else {
        setHealthScores(p => ({ ...p, [repo.id]: { ...p[repo.id], loading: false } }));
      }
    } catch {
      setHealthScores(p => ({ ...p, [repo.id]: { ...p[repo.id], loading: false } }));
    }
  }

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
      if (res.status === 409) { setError("Already added."); return; }
      if (res.status === 404) { setError("Repo not found on GitHub."); return; }
      if (!res.ok) { setError("Failed to add repository."); return; }
      const newRepo: Repo = await res.json();
      setRepos(p => [newRepo, ...p]);
      setRepoInput("");
    } catch { setError("Network error. Is the backend running?"); }
    finally { setAdding(false); }
  }

  async function handleDeleteRepo(id: number) {
    if (!user || !confirm("Remove this repository from AutoScribe?")) return;
    try {
      const res = await fetch(`${API}/repos/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${user.access_token}` } });
      if (!res.ok) throw new Error();
      setRepos(p => p.filter(r => r.id !== id));
      if (selectedRepo?.id === id) { setSelectedRepo(null); setParseResults([]); setRightPanel("empty"); }
    } catch { setError("Failed to remove repository."); }
  }

  async function handleParseRepo(repo: Repo) {
    if (!user) return;
    setSelectedRepo(repo); setParseResults([]); setParseError("");
    setReadme(""); setRightPanel("parse"); setParsing(true);
    try {
      await fetch(`${API}/repos/${repo.id}/parse`, { method: "POST", headers: { Authorization: `Bearer ${user.access_token}` } });
      const rr = await fetch(`${API}/repos/${repo.id}/parse`, { headers: { Authorization: `Bearer ${user.access_token}` } });
      if (!rr.ok) throw new Error();
      const data: ParsedFile[] = await rr.json();
      setParseResults(data.sort((a, b) => a.file_path.localeCompare(b.file_path)));
      setExpandedFiles(new Set());
      loadHealthScore(repo);
    } catch { setParseError("Failed to parse repository."); }
    finally { setParsing(false); }
  }

  async function handleGenerateReadme(repo?: Repo) {
    const r = repo ?? selectedRepo;
    if (!user || !r) return;
    if (repo) setSelectedRepo(repo);
    setGeneratingReadme(true); setReadmeError(""); setRightPanel("readme");
    try {
      const res = await fetch(`${API}/repos/${r.id}/generate-readme`, {
        method: "POST", headers: { Authorization: `Bearer ${user.access_token}` },
      });
      if (!res.ok) { setReadmeError("Failed to generate README. Parse the repo first."); return; }
      const data = await res.json();
      setReadme(data.content);
      loadHealthScore(r);
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
      loadHealthScore(selectedRepo);
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

  async function handleOpenStaleness(repo: Repo) {
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
      await handleOpenStaleness(selectedRepo);
      loadHealthScore(selectedRepo);
    } catch { /* silent */ }
    finally { setUpdatingDocs(false); }
  }

  async function handleOpenAnalytics(repo: Repo) {
    if (!user) return;
    setSelectedRepo(repo); setRightPanel("analytics");
    setAnalytics(null); setLoadingAnalytics(true); setAnalyticsError("");
    try {
      const res = await fetch(`${API}/repos/${repo.id}/analytics`, { headers: { Authorization: `Bearer ${user.access_token}` } });
      if (!res.ok) { setAnalyticsError("Failed to load analytics. Parse the repo first."); return; }
      setAnalytics(await res.json());
    } catch { setAnalyticsError("Network error."); }
    finally { setLoadingAnalytics(false); }
  }

  async function handleOpenWebhook(repo: Repo) {
    if (!user) return;
    setSelectedRepo(repo); setRightPanel("webhook");
    setWebhookSaved(null); setWebhookError("");
    try {
      const res = await fetch(`${API}/webhooks/${repo.id}/webhook-status`, { headers: { Authorization: `Bearer ${user.access_token}` } });
      if (res.ok) {
        const data = await res.json();
        setWebhookStatus(data);
        if (data.configured) setWebhookAutoRegen(data.auto_regenerate ?? true);
      }
    } catch { /* silent */ }
  }

  async function handleSaveWebhook(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !selectedRepo) return;
    setSavingWebhook(true); setWebhookError(""); setWebhookSaved(null);
    try {
      const res = await fetch(`${API}/webhooks/${selectedRepo.id}/configure-webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.access_token}` },
        body: JSON.stringify({ enabled: true, auto_regenerate: webhookAutoRegen, webhook_secret: webhookSecret || `as_${Math.random().toString(36).slice(2)}` }),
      });
      if (!res.ok) { setWebhookError("Failed to save webhook config."); return; }
      const data = await res.json();
      setWebhookSaved(data);
      setWebhookStatus({ configured: true, enabled: true, auto_regenerate: webhookAutoRegen });
    } catch { setWebhookError("Network error."); }
    finally { setSavingWebhook(false); }
  }

  async function loadPromptTemplates() {
    try {
      const res = await fetch(`${API}/prompt-editor/templates`);
      if (res.ok) { const data = await res.json(); setPromptTemplates(data.templates); }
    } catch { /* silent */ }
  }

  async function handleValidatePrompt() {
    if (!activePrompt.trim()) return;
    setValidating(true);
    try {
      const res = await fetch(`${API}/prompt-editor/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: activePrompt, doc_type: activeDocType }),
      });
      if (res.ok) setPromptValidation(await res.json());
    } catch { /* silent */ }
    finally { setValidating(false); }
  }

  async function handlePreviewPrompt() {
    if (!user || !selectedRepo || !activePrompt.trim()) return;
    setPreviewing(true); setPreviewError(""); setPreviewContent(""); setPromptTab("preview");
    try {
      const res = await fetch(`${API}/prompt-editor/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.access_token}` },
        body: JSON.stringify({ prompt: activePrompt, doc_type: activeDocType, repo_id: selectedRepo.id }),
      });
      if (!res.ok) { setPreviewError("Preview failed. Is the repo parsed?"); setPromptTab("editor"); return; }
      const data = await res.json();
      setPreviewContent(data.content);
    } catch { setPreviewError("Network error during preview."); setPromptTab("editor"); }
    finally { setPreviewing(false); }
  }

  async function handleGenerateWithPrompt() {
    if (!user || !selectedRepo || !activePrompt.trim()) return;
    setGeneratingWithPrompt(true); setPromptGenError(""); setPromptGenSuccess("");
    try {
      const res = await fetch(`${API}/prompt-editor/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.access_token}` },
        body: JSON.stringify({ prompt: activePrompt, doc_type: activeDocType, repo_id: selectedRepo.id, create_pr: createPR }),
      });
      if (!res.ok) { setPromptGenError("Generation failed."); return; }
      const data = await res.json();
      setPromptGenSuccess(data.pr ? `✅ Saved & PR created: ${data.pr.pr_url}` : "✅ Documentation saved.");
      loadEditHistory();
      loadHealthScore(selectedRepo);
    } catch { setPromptGenError("Network error."); }
    finally { setGeneratingWithPrompt(false); }
  }

  async function loadEditHistory() {
    if (!user || !selectedRepo) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`${API}/prompt-editor/${selectedRepo.id}/history/${activeDocType}`, {
        headers: { Authorization: `Bearer ${user.access_token}` },
      });
      if (res.ok) setEditHistory((await res.json()).history);
    } catch { /* silent */ }
    finally { setLoadingHistory(false); }
  }

  function handleSelectTemplate(tpl: PromptTemplate) {
    setSelectedTemplate(tpl);
    setActivePrompt(tpl.prompt);
    setActiveDocType(tpl.doc_type);
    setPromptValidation(null);
    setPreviewContent("");
    setPromptGenSuccess("");
  }

  function handleOpenPromptEditor(repo?: Repo) {
    if (repo) setSelectedRepo(repo);
    setPromptEditorOpen(true);
    setPromptTab("editor");
    if (promptTemplates.length === 0) loadPromptTemplates();
    if (selectedRepo || repo) loadEditHistory();
  }

  function toggleFile(path: string) {
    setExpandedFiles(p => { const n = new Set(p); n.has(path) ? n.delete(path) : n.add(path); return n; });
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

  const totalSymbols = parseResults.reduce((a, f) => a + f.symbols.length, 0);
  const avgCoverage = Object.values(healthScores)
    .filter(h => h.coverage_pct !== null)
    .reduce((a, h, _, arr) => a + (h.coverage_pct ?? 0) / arr.length, 0);

  if (!user) return <LoginPage onLogin={handleLogin} />;

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f7ff] dark:bg-[#0f0f14]">
      <Topbar
        user={user}
        sidebarOpen={sidebarOpen}
        selectedRepo={selectedRepo}
        onToggleSidebar={() => setSidebarOpen(v => !v)}
        onOpenPromptEditor={() => handleOpenPromptEditor()}
        onLogout={handleLogout}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? "w-80" : "w-0"} flex-shrink-0 transition-all duration-200 overflow-hidden`}>
          <div className="w-80 h-full flex flex-col">
            <Sidebar
              repos={repos}
              selectedRepo={selectedRepo}
              healthScores={healthScores}
              loading={loading}
              error={error}
              repoInput={repoInput}
              adding={adding}
              parsing={parsing}
              generatingReadme={generatingReadme}
              loadingAnalytics={loadingAnalytics}
              onRepoInputChange={setRepoInput}
              onAddRepo={handleAddRepo}
              onSelectRepo={setSelectedRepo}
              onDeleteRepo={handleDeleteRepo}
              onParseRepo={handleParseRepo}
              onGenerateReadme={handleGenerateReadme}
              onOpenSearch={handleOpenSearch}
              onOpenAnalytics={handleOpenAnalytics}
              onOpenWebhook={handleOpenWebhook}
              onOpenPromptEditor={handleOpenPromptEditor}
            />
          </div>
        </div>

        {/* Main */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          {repos.length > 0 && (
            <StatsStrip
              repos={repos}
              totalSymbols={totalSymbols}
              avgCoverage={avgCoverage}
              hasHealthData={Object.keys(healthScores).length > 0}
              selectedRepo={selectedRepo}
            />
          )}

          {selectedRepo && (
            <TabBar
              selectedRepo={selectedRepo}
              rightPanel={rightPanel}
              hasDocstrings={!!docstringsFile}
              onSelect={setRightPanel}
            />
          )}

          <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
            {rightPanel === "empty" && (
              <EmptyState
                icon="🚀"
                title="Select a repository to get started"
                sub="Add a GitHub repo from the sidebar, then Parse, generate docs, or check Analytics."
              />
            )}

            {rightPanel === "parse" && (
              <ParsePanel
                parsing={parsing}
                parseError={parseError}
                parseResults={parseResults}
                expandedFiles={expandedFiles}
                onToggleFile={toggleFile}
                onGenerateDocstrings={handleGenerateDocstrings}
                repoName={selectedRepo?.full_name}
              />
            )}

            {rightPanel === "readme" && (
              <ReadmePanel
                generating={generatingReadme}
                error={readmeError}
                readme={readme}
                copied={copied}
                onCopy={handleCopy}
              />
            )}

            {rightPanel === "docstrings" && (
              <DocstringsPanel
                generating={generatingDocstrings}
                error={docstringsError}
                docstrings={docstrings}
                filePath={docstringsFile}
                onCopy={handleCopy}
              />
            )}

            {rightPanel === "search" && (
              <SearchPanel
                indexStats={indexStats}
                indexing={indexing}
                indexError={indexError}
                searchMode={searchMode}
                searchQuery={searchQuery}
                searching={searching}
                searchResults={searchResults}
                searchError={searchError}
                ragQuestion={ragQuestion}
                ragAsking={ragAsking}
                ragAnswer={ragAnswer}
                ragSources={ragSources}
                ragError={ragError}
                onIndexRepo={handleIndexRepo}
                onSearchModeChange={setSearchMode}
                onSearchQueryChange={setSearchQuery}
                onSearch={handleSearch}
                onRagQuestionChange={setRagQuestion}
                onAsk={handleAsk}
              />
            )}

            {rightPanel === "analytics" && (
              <AnalyticsPanel
                loading={loadingAnalytics}
                error={analyticsError}
                analytics={analytics}
                onViewStaleness={handleOpenStaleness}
                selectedRepo={selectedRepo}
              />
            )}

            {rightPanel === "staleness" && (
              <StalenessPanel
                checking={checkingStale}
                error={stalenessError}
                report={stalenessReport}
                updating={updatingDocs}
                repoName={selectedRepo?.full_name}
                onUpdate={handleIncrementalUpdate}
              />
            )}

            {rightPanel === "webhook" && (
              <WebhookPanel
                webhookStatus={webhookStatus}
                webhookSecret={webhookSecret}
                webhookAutoRegen={webhookAutoRegen}
                saving={savingWebhook}
                saved={webhookSaved}
                error={webhookError}
                copied={copied}
                onSecretChange={setWebhookSecret}
                onAutoRegenToggle={() => setWebhookAutoRegen(v => !v)}
                onSave={handleSaveWebhook}
                onCopy={handleCopy}
              />
            )}
          </div>
        </main>
      </div>

      <PromptEditorModal
        open={promptEditorOpen}
        selectedRepo={selectedRepo}
        promptTemplates={promptTemplates}
        selectedTemplate={selectedTemplate}
        activePrompt={activePrompt}
        activeDocType={activeDocType}
        promptValidation={promptValidation}
        previewContent={previewContent}
        previewing={previewing}
        previewError={previewError}
        generatingWithPrompt={generatingWithPrompt}
        promptGenError={promptGenError}
        promptGenSuccess={promptGenSuccess}
        editHistory={editHistory}
        loadingHistory={loadingHistory}
        createPR={createPR}
        promptTab={promptTab}
        validating={validating}
        copied={copied}
        onClose={() => setPromptEditorOpen(false)}
        onSelectTemplate={handleSelectTemplate}
        onPromptChange={v => { setActivePrompt(v); setPromptValidation(null); setPromptGenSuccess(""); }}
        onDocTypeChange={v => { setActiveDocType(v); setPromptValidation(null); }}
        onValidate={handleValidatePrompt}
        onPreview={handlePreviewPrompt}
        onGenerate={handleGenerateWithPrompt}
        onTabChange={t => { setPromptTab(t); if (t === "history") loadEditHistory(); }}
        onCreatePRToggle={() => setCreatePR(v => !v)}
        onRestorePrompt={p => { setActivePrompt(p); setPromptTab("editor"); }}
        onCopy={handleCopy}
      />
    </div>
  );
}

export default App;