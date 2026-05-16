import type { RightPanel, Repo } from "../types";

const TABS: { id: RightPanel; label: string }[] = [
  { id: "parse",      label: "Structure" },
  { id: "readme",     label: "README" },
  { id: "docstrings", label: "Docstrings" },
  { id: "search",     label: "Search" },
  { id: "analytics",  label: "Analytics" },
  { id: "staleness",  label: "Health" },
  { id: "webhook",    label: "PR Bot" },
];

interface Props {
  selectedRepo: Repo;
  rightPanel: RightPanel;
  hasDocstrings: boolean;
  onSelect: (id: RightPanel) => void;
}

export function TabBar({ selectedRepo, rightPanel, hasDocstrings, onSelect }: Props) {
  const tabs = TABS.filter(t => t.id !== "docstrings" || hasDocstrings);
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '0 16px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--surface)',
      overflowX: 'auto', flexShrink: 0,
      gap: 0,
    }}>
      {/* Repo breadcrumb */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 12, fontFamily: 'DM Mono, monospace',
        color: 'var(--text-3)',
        marginRight: 20, flexShrink: 0,
        padding: '14px 0',
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        {selectedRepo.full_name}
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 18, background: 'var(--border)', marginRight: 20, flexShrink: 0 }} />

      {/* Tabs */}
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          className={rightPanel === tab.id ? 'tab-active' : ''}
          style={{
            padding: '0 14px',
            height: 48,
            fontSize: 13,
            fontWeight: 500,
            fontFamily: 'DM Sans, sans-serif',
            color: rightPanel === tab.id ? 'var(--text-1)' : 'var(--text-3)',
            background: 'transparent',
            border: 'none', cursor: 'pointer',
            whiteSpace: 'nowrap', flexShrink: 0,
            transition: 'color 0.12s',
            letterSpacing: '-0.01em',
          }}
          onMouseEnter={e => { if (rightPanel !== tab.id) e.currentTarget.style.color = 'var(--text-2)'; }}
          onMouseLeave={e => { if (rightPanel !== tab.id) e.currentTarget.style.color = 'var(--text-3)'; }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}