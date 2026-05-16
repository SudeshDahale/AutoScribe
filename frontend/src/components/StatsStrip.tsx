import type { Repo } from "../types";

interface Props {
  repos: Repo[];
  totalSymbols: number;
  avgCoverage: number;
  hasHealthData: boolean;
  selectedRepo: Repo | null;
}

export function StatsStrip({ repos, totalSymbols, avgCoverage, hasHealthData, selectedRepo }: Props) {
  const stats = [
    { label: 'Repos', value: repos.length },
    { label: 'Symbols', value: totalSymbols > 0 ? totalSymbols.toLocaleString() : '—' },
    { label: 'Avg Coverage', value: hasHealthData ? `${Math.round(avgCoverage)}%` : '—' },
    ...(selectedRepo ? [{ label: 'Active', value: selectedRepo.full_name.split('/')[1] }] : []),
  ];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 0,
      padding: '0 16px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--surface)',
      height: 38, flexShrink: 0,
      overflowX: 'auto',
    }}>
      {stats.map((s, i) => (
        <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {i > 0 && <div style={{ width: 1, height: 14, background: 'var(--border)', margin: '0 14px' }} />}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 500, fontFamily: 'DM Sans, sans-serif' }}>
              {s.label}
            </span>
            <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--text-1)', fontWeight: 500 }}>
              {s.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}