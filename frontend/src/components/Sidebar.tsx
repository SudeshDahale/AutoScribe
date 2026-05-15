import type { Repo, RepoHealth } from "../types";
import { LANG_COLOR, LANG_ICON } from "../constants";
import { Badge } from "./ui/Badge";
import { Spinner } from "./ui/Spinner";
import { EmptyState } from "./ui/EmptyState";
import { HealthPill } from "./ui/HealthPill";

interface Props {
  repos: Repo[];
  selectedRepo: Repo | null;
  healthScores: Record<number, RepoHealth>;
  loading: boolean;
  error: string;
  repoInput: string;
  adding: boolean;
  parsing: boolean;
  generatingReadme: boolean;
  loadingAnalytics: boolean;
  onRepoInputChange: (v: string) => void;
  onAddRepo: (e: React.FormEvent) => void;
  onSelectRepo: (r: Repo) => void;
  onDeleteRepo: (id: number) => void;
  onParseRepo: (r: Repo) => void;
  onGenerateReadme: (r: Repo) => void;
  onOpenSearch: (r: Repo) => void;
  onOpenAnalytics: (r: Repo) => void;
  onOpenWebhook: (r: Repo) => void;
  onOpenPromptEditor: (r: Repo) => void;
}

export function Sidebar({
  repos, selectedRepo, healthScores, loading, error,
  repoInput, adding, parsing, generatingReadme, loadingAnalytics,
  onRepoInputChange, onAddRepo, onSelectRepo, onDeleteRepo,
  onParseRepo, onGenerateReadme, onOpenSearch, onOpenAnalytics,
  onOpenWebhook, onOpenPromptEditor,
}: Props) {
  return (
    <aside className="flex flex-col h-full border-r border-gray-100 dark:border-white/[0.06] bg-white/60 dark:bg-[#12121a]/60 backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-white/[0.06]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300">Repositories</h2>
          <Badge className="bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400 font-bold">
            {repos.length}
          </Badge>
        </div>

        <form onSubmit={onAddRepo} className="flex gap-2">
          <input
            type="text"
            placeholder="owner/repo-name"
            value={repoInput}
            onChange={(e) => onRepoInputChange(e.target.value)}
            disabled={adding}
            className="input-base flex-1 min-w-0 py-2 text-xs"
          />
          <button
            type="submit"
            disabled={adding || !repoInput.trim()}
            className="btn-primary flex-shrink-0 px-3 py-2 text-xs rounded-xl"
          >
            {adding ? "…" : "Add"}
          </button>
        </form>

        {error && (
          <p className="text-xs text-red-500 mt-2 flex items-center gap-1.5">
            <span>⚠</span> {error}
          </p>
        )}
      </div>

      {/* Repo list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
        {loading ? (
          <Spinner label="Loading repos…" />
        ) : repos.length === 0 ? (
          <EmptyState icon="📁" title="No repos yet" sub="Add a GitHub repo above to get started" />
        ) : (
          repos.map((repo) => {
            const health = healthScores[repo.id];
            const isSelected = selectedRepo?.id === repo.id;

            return (
              <div
                key={repo.id}
                onClick={() => onSelectRepo(repo)}
                className={`group rounded-2xl border p-3.5 cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? "border-violet-300 dark:border-violet-700/60 bg-violet-50 dark:bg-violet-900/15 shadow-glow"
                    : "border-transparent hover:border-gray-200 dark:hover:border-white/[0.08] hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                }`}
              >
                {/* Repo name row */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <a
                    href={repo.github_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-sm font-semibold text-gray-800 dark:text-gray-200 hover:text-violet-600 truncate leading-tight"
                  >
                    {repo.full_name}
                  </a>

                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteRepo(repo.id); }}
                    className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-xs flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>

                {/* Health row */}
                <div className="flex items-center gap-2 mb-1.5">
                  <HealthPill
                    health={
                      health ?? {
                        repoId: repo.id,
                        coverage_pct: null,
                        stale_count: null,
                        status: null,
                        loading: false,
                      }
                    }
                  />
                  {health?.stale_count != null && health.stale_count > 0 && (
                    <span className="text-[10px] text-yellow-600 dark:text-yellow-500 font-medium">
                      ⚠ {health.stale_count} stale
                    </span>
                  )}
                </div>

                {repo.description && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-2 line-clamp-2 leading-relaxed">
                    {repo.description}
                  </p>
                )}

                {/* Badges */}
                <div className="flex flex-wrap gap-1 mb-2.5">
                  {repo.language && (
                    <Badge className={LANG_COLOR[repo.language.toLowerCase()] ?? "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400"}>
                      {LANG_ICON[repo.language.toLowerCase()] ?? "🔤"} {repo.language}
                    </Badge>
                  )}
                  <Badge className="bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400">
                    ⭐ {repo.stars.toLocaleString()}
                  </Badge>
                </div>

                {/* Action buttons */}
                <div className="flex gap-1 flex-wrap">
                  {[
                    { label: "⚙ Parse", action: () => onParseRepo(repo), busy: parsing && selectedRepo?.id === repo.id },
                    { label: "✨ README", action: () => onGenerateReadme(repo), busy: generatingReadme && selectedRepo?.id === repo.id },
                    { label: "🔍 Search", action: () => onOpenSearch(repo), busy: false },
                    { label: "📊 Analytics", action: () => onOpenAnalytics(repo), busy: loadingAnalytics && selectedRepo?.id === repo.id },
                    { label: "🤖 PR Bot", action: () => onOpenWebhook(repo), busy: false },
                    { label: "✏️ Prompt", action: () => onOpenPromptEditor(repo), busy: false },
                  ].map(({ label, action, busy }) => (
                    <button
                      key={label}
                      onClick={(e) => { e.stopPropagation(); action(); }}
                      disabled={busy}
                      className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-white dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-gray-400 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 disabled:opacity-40 transition-all duration-100"
                    >
                      {busy ? "…" : label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}