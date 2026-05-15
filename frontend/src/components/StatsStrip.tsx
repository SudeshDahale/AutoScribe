import { StatCard } from "./ui/StatCard";
import type { Repo } from "../types";

interface Props {
  repos: Repo[];
  totalSymbols: number;
  avgCoverage: number;
  hasHealthData: boolean;
  selectedRepo: Repo | null;
}

export function StatsStrip({ repos, totalSymbols, avgCoverage, hasHealthData, selectedRepo }: Props) {
  const totalStars = repos.reduce((a, r) => a + r.stars, 0);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 border-b border-gray-100 dark:border-white/[0.06] bg-white/50 dark:bg-[#17171f]/50">
      <StatCard icon="📦" label="Repos" value={repos.length} />
      <StatCard icon="⭐" label="Total Stars" value={totalStars.toLocaleString()} />
      <StatCard icon="🔣" label="Symbols Parsed" value={totalSymbols} sub={selectedRepo?.full_name ?? "select a repo"} />
      <StatCard
        icon="📊" label="Avg Coverage"
        value={hasHealthData ? `${Math.round(avgCoverage)}%` : "—"}
        sub="across all repos"
      />
    </div>
  );
}