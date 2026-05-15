import type { RepoHealth } from "../../types";

export function HealthPill({ health }: { health: RepoHealth }) {
  if (health.loading) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-white/5 text-gray-400 animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
        Loading…
      </span>
    );
  }
  if (health.coverage_pct === null) return null;
  const pct = health.coverage_pct;
  const [bg, dot, text] =
    pct >= 75
      ? ["bg-emerald-50 dark:bg-emerald-900/20", "bg-emerald-500", "text-emerald-700 dark:text-emerald-400"]
      : pct >= 40
      ? ["bg-yellow-50 dark:bg-yellow-900/20", "bg-yellow-400", "text-yellow-700 dark:text-yellow-400"]
      : ["bg-red-50 dark:bg-red-900/20", "bg-red-500", "text-red-700 dark:text-red-400"];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${bg} ${text} border-current/20`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {pct}%
    </span>
  );
}