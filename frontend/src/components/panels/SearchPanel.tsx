import { SYMBOL_COLOR, SYMBOL_ICON } from "../../constants";
import { Badge } from "../ui/Badge";
import { Spinner } from "../ui/Spinner";
import { ErrorMsg } from "../ui/ErrorMsg";
import type { IndexStats, SearchResult } from "../../types";

interface Props {
  indexStats: IndexStats | null;
  indexing: boolean;
  indexError: string;
  searchMode: "search" | "ask";
  searchQuery: string;
  searching: boolean;
  searchResults: SearchResult[];
  searchError: string;
  ragQuestion: string;
  ragAsking: boolean;
  ragAnswer: string;
  ragSources: SearchResult[];
  ragError: string;
  onIndexRepo: () => void;
  onSearchModeChange: (m: "search" | "ask") => void;
  onSearchQueryChange: (v: string) => void;
  onSearch: (e: React.FormEvent) => void;
  onRagQuestionChange: (v: string) => void;
  onAsk: (e: React.FormEvent) => void;
}

export function SearchPanel({
  indexStats, indexing, indexError,
  searchMode, searchQuery, searching, searchResults, searchError,
  ragQuestion, ragAsking, ragAnswer, ragSources, ragError,
  onIndexRepo, onSearchModeChange, onSearchQueryChange, onSearch,
  onRagQuestionChange, onAsk,
}: Props) {
  return (
    <div className="max-w-3xl animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Semantic Search + RAG</h2>
          <p className="text-xs text-gray-400 mt-0.5">Search symbols or ask AI questions about your codebase</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {indexStats?.indexed
            ? <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold">✅ {indexStats.symbol_count} indexed</Badge>
            : <Badge className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400">⚠ Not indexed</Badge>
          }
          <button onClick={onIndexRepo} disabled={indexing} className="btn-primary text-xs py-1.5 px-3">
            {indexing ? "Indexing…" : "⚡ Index"}
          </button>
        </div>
      </div>

      {indexError && <ErrorMsg msg={indexError} />}

      {/* Mode toggle */}
      <div className="flex gap-1 p-1 rounded-2xl bg-gray-100 dark:bg-white/[0.05] mb-5 w-fit border border-gray-200 dark:border-white/[0.06]">
        {(["search", "ask"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => onSearchModeChange(mode)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
              searchMode === mode
                ? "bg-white dark:bg-[#17171f] text-gray-900 dark:text-gray-100 shadow-sm border border-gray-200 dark:border-white/[0.08]"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {mode === "search" ? "🔎 Search" : "🤖 Ask AI"}
          </button>
        ))}
      </div>

      {searchMode === "search" && (
        <>
          <form onSubmit={onSearch} className="flex gap-2 mb-5">
            <input
              className="input-base flex-1"
              placeholder="e.g. function that handles authentication"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              disabled={searching}
            />
            <button type="submit" disabled={searching || !searchQuery.trim()} className="btn-primary px-5">
              {searching ? "…" : "Search"}
            </button>
          </form>
          {searchError && <ErrorMsg msg={searchError} />}
          {searching && <Spinner label="Searching…" />}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((r, i) => (
                <div key={i} className="card p-4 hover:shadow-card-hover transition-shadow">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className={`font-mono text-sm font-bold ${SYMBOL_COLOR[r.type] ?? "text-gray-400"}`}>{SYMBOL_ICON[r.type] ?? "·"}</span>
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{r.name}</span>
                    <Badge className="bg-gray-100 dark:bg-white/[0.06] text-gray-400">{r.type}</Badge>
                    <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ml-auto font-bold">
                      {(r.score * 100).toFixed(0)}% match
                    </Badge>
                  </div>
                  <p className="text-xs font-mono text-gray-400 mb-2">{r.file_path}:{r.line}</p>
                  {r.docstring && <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">{r.docstring}</p>}
                </div>
              ))}
            </div>
          )}
          {!searching && searchResults.length === 0 && searchQuery && (
            <p className="text-sm text-gray-400 text-center mt-10">No results. Make sure the repo is indexed first.</p>
          )}
        </>
      )}

      {searchMode === "ask" && (
        <>
          <form onSubmit={onAsk} className="flex gap-2 mb-5">
            <input
              className="input-base flex-1"
              placeholder="e.g. What does the parse_repo function do?"
              value={ragQuestion}
              onChange={(e) => onRagQuestionChange(e.target.value)}
              disabled={ragAsking}
            />
            <button type="submit" disabled={ragAsking || !ragQuestion.trim()} className="btn-primary px-5">
              {ragAsking ? "…" : "Ask"}
            </button>
          </form>
          {ragError && <ErrorMsg msg={ragError} />}
          {ragAsking && <Spinner label="Thinking…" />}
          {ragAnswer && (
            <div className="rounded-2xl border border-violet-200 dark:border-violet-800/50 bg-violet-50 dark:bg-violet-900/10 p-5 mb-4">
              <p className="text-xs font-bold text-violet-600 dark:text-violet-400 mb-2 uppercase tracking-wide">🤖 Answer</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{ragAnswer}</p>
            </div>
          )}
          {ragSources.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">📎 Sources ({ragSources.length})</p>
              <div className="space-y-1.5">
                {ragSources.map((r, i) => (
                  <div key={i} className="flex items-center gap-2.5 rounded-xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-[#17171f] px-3.5 py-2.5">
                    <span className={`font-mono text-xs font-bold ${SYMBOL_COLOR[r.type] ?? "text-gray-400"}`}>{SYMBOL_ICON[r.type] ?? "·"}</span>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{r.name}</span>
                    <span className="text-xs text-gray-400 font-mono truncate">{r.file_path}:{r.line}</span>
                    <Badge className="bg-gray-100 dark:bg-white/[0.06] text-gray-400 ml-auto">{(r.score * 100).toFixed(0)}%</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}