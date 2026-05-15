import { coverageBarColor, coverageColor, formatDate } from "../../constants";
import { CoverageRing } from "../ui/CoverageRing";
import { Spinner } from "../ui/Spinner";
import { EmptyState } from "../ui/EmptyState";
import { ErrorMsg } from "../ui/ErrorMsg";
import type { Analytics, Repo } from "../../types";

interface Props {
  loading: boolean;
  error: string;
  analytics: Analytics | null;
  onViewStaleness: (repo: Repo) => void;
  selectedRepo: Repo | null;
}

export function AnalyticsPanel({ loading, error, analytics, onViewStaleness, selectedRepo }: Props) {
  if (loading) return <Spinner label="Loading analytics…" />;
  if (error) return <ErrorMsg msg={error} />;
  if (!analytics) return <EmptyState icon="📊" title="No analytics yet" sub='Click "📊 Analytics" on a repo to load data.' />;

  return (
    <div className="max-w-3xl space-y-4 animate-fade-in">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Documentation Analytics</h2>
        <p className="text-xs text-gray-400 mt-0.5">Coverage and health metrics for your repository</p>
      </div>

      {/* Top row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Coverage ring */}
        <div className="card p-6 flex flex-col items-center gap-3 shadow-card">
          <CoverageRing pct={analytics.coverage_pct} size={110} />
          <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Doc Coverage</p>
          <p className="text-xs text-gray-400">{analytics.documented_symbols} / {analytics.total_symbols} symbols</p>
        </div>

        {/* Files & Symbols */}
        <div className="card p-5 shadow-card">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Files & Symbols</p>
          <div className="space-y-3">
            {[
              ["Total files", analytics.total_files],
              ["Total symbols", analytics.total_symbols],
              ["Docstring files", analytics.docstring_files_count],
              ["README", analytics.has_readme ? "✅ Yes" : "❌ No"],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">{label}</span>
                <span className={`font-bold text-gray-900 dark:text-gray-100 ${String(value).includes("✅") ? "text-emerald-600 dark:text-emerald-400" : String(value).includes("❌") ? "text-red-500" : ""}`}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Staleness */}
        <div className="card p-5 shadow-card">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Staleness</p>
          <div className="space-y-3">
            {[
              ["Stale files", analytics.stale_count, analytics.stale_count > 0 ? "text-yellow-600 dark:text-yellow-400" : "text-emerald-600"],
              ["New (undoc.)", analytics.stale_breakdown.new, ""],
              ["Modified", analytics.stale_breakdown.modified, ""],
              ["Last documented", formatDate(analytics.last_documented_at), "text-xs"],
            ].map(([label, value, cls]) => (
              <div key={String(label)} className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">{label}</span>
                <span className={`font-bold text-gray-900 dark:text-gray-100 ${cls}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Coverage bar */}
      <div className="card p-5 shadow-card">
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Symbol Coverage Breakdown</p>
          <span className={`text-sm font-bold ${coverageColor(analytics.coverage_pct)}`}>{analytics.coverage_pct}%</span>
        </div>
        <div className="h-3 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${coverageBarColor(analytics.coverage_pct)}`}
            style={{ width: `${analytics.coverage_pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>{analytics.documented_symbols} documented</span>
          <span>{analytics.total_symbols - analytics.documented_symbols} undocumented</span>
        </div>
      </div>

      {/* Status banner */}
      <div className={`card p-5 flex items-center gap-4 ${
        analytics.status === "up_to_date"
          ? "border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/10"
          : "border-yellow-200 dark:border-yellow-800/50 bg-yellow-50 dark:bg-yellow-900/10"
      }`}>
        <span className="text-2xl">{analytics.status === "up_to_date" ? "✅" : "⚠️"}</span>
        <div className="flex-1">
          <p className={`text-sm font-bold ${analytics.status === "up_to_date" ? "text-emerald-800 dark:text-emerald-300" : "text-yellow-800 dark:text-yellow-300"}`}>
            {analytics.status === "up_to_date" ? "All documentation is current" : `${analytics.stale_count} file(s) need updates`}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {analytics.coverage_pct >= 75 ? "Great coverage! Keep it up." : analytics.coverage_pct >= 40 ? "Coverage could be improved." : "Low coverage — generate more docstrings."}
          </p>
        </div>
        {analytics.status !== "up_to_date" && selectedRepo && (
          <button onClick={() => onViewStaleness(selectedRepo)} className="btn-ghost text-xs flex-shrink-0">
            View Details →
          </button>
        )}
      </div>
    </div>
  );
}