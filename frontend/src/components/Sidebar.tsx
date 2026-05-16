import type { Repo, RepoHealth } from "../types";
import { LANG_COLOR, LANG_ICON } from "../constants";

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

function CoverageDot({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="dot-gray" />;
  if (pct >= 70) return <span className="dot-green" />;
  if (pct >= 35) return <span className="dot-amber" />;
  return <span className="dot-red" />;
}

export function Sidebar({
  repos, selectedRepo, healthScores, loading, error,
  repoInput, adding, parsing, generatingReadme, loadingAnalytics,
  onRepoInputChange, onAddRepo, onSelectRepo, onDeleteRepo,
  onParseRepo, onGenerateReadme, onOpenSearch, onOpenAnalytics,
  onOpenWebhook, onOpenPromptEditor,
}: Props) {
  return (
    <aside style={{
      display: 'flex', flexDirection: 'column',
      height: '100%',
      borderRight: '1px solid var(--border)',
      background: 'var(--surface)',
    }}>
      {/* Add repo */}
      <div style={{ padding: '14px 14px 12px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'DM Sans, sans-serif' }}>
            Repositories
          </span>
          <span style={{
            fontSize: 11, fontFamily: 'DM Mono, monospace',
            color: 'var(--text-3)',
            background: 'var(--surface-3)',
            border: '1px solid var(--border)',
            borderRadius: 5, padding: '1px 6px',
          }}>
            {repos.length}
          </span>
        </div>
        <form onSubmit={onAddRepo} style={{ display: 'flex', gap: 6 }}>
          <input
            className="input-base"
            type="text"
            placeholder="owner/repo"
            value={repoInput}
            onChange={e => onRepoInputChange(e.target.value)}
            disabled={adding}
            style={{ flex: 1, minWidth: 0 }}
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={adding || !repoInput.trim()}
            style={{ flexShrink: 0, padding: '0 12px' }}
          >
            {adding ? '…' : 'Add'}
          </button>
        </form>
        {error && (
          <p style={{ fontSize: 12, color: '#f87171', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>⚠</span> {error}
          </p>
        )}
      </div>

      {/* List */}
      <div className="scrollbar-thin" style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
        {loading ? (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <div className="spinner" />
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 12 }}>Loading…</p>
          </div>
        ) : repos.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>◫</div>
            <p style={{ fontSize: 13, color: 'var(--text-3)', fontFamily: 'DM Mono, monospace' }}>No repos yet</p>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>Add a GitHub repo above</p>
          </div>
        ) : (
          repos.map(repo => {
            const health = healthScores[repo.id];
            const isSelected = selectedRepo?.id === repo.id;

            const actions = [
              { label: 'Parse', shortLabel: '⚙', action: () => onParseRepo(repo), busy: parsing && selectedRepo?.id === repo.id },
              { label: 'README', shortLabel: '✦', action: () => onGenerateReadme(repo), busy: generatingReadme && selectedRepo?.id === repo.id },
              { label: 'Search', shortLabel: '⌕', action: () => onOpenSearch(repo), busy: false },
              { label: 'Analytics', shortLabel: '◈', action: () => onOpenAnalytics(repo), busy: loadingAnalytics && selectedRepo?.id === repo.id },
              { label: 'PR Bot', shortLabel: '⟲', action: () => onOpenWebhook(repo), busy: false },
              { label: 'Prompt', shortLabel: '✎', action: () => onOpenPromptEditor(repo), busy: false },
            ];

            return (
              <div
                key={repo.id}
                onClick={() => onSelectRepo(repo)}
                style={{
                  borderRadius: 10,
                  border: `1px solid ${isSelected ? 'var(--amber-border)' : 'transparent'}`,
                  background: isSelected ? 'var(--amber-dim)' : 'transparent',
                  padding: '10px 10px 8px',
                  cursor: 'pointer',
                  marginBottom: 4,
                  transition: 'all 0.12s',
                  position: 'relative',
                }}
                onMouseEnter={e => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'var(--surface-3)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }
                }}
              >
                {/* Name + delete */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 6 }}>
                  <a
                    href={repo.github_url}
                    target="_blank" rel="noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{
                      fontSize: 13, fontWeight: 600,
                      fontFamily: 'DM Mono, monospace',
                      color: isSelected ? 'var(--amber)' : 'var(--text-1)',
                      textDecoration: 'none',
                      lineHeight: 1.3,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                  >
                    {repo.full_name}
                  </a>
                  <button
                    onClick={e => { e.stopPropagation(); onDeleteRepo(repo.id); }}
                    style={{
                      width: 20, height: 20, borderRadius: 5,
                      border: 'none', background: 'transparent',
                      cursor: 'pointer', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text-3)', fontSize: 11,
                      opacity: 0, transition: 'all 0.12s',
                    }}
                    className="delete-btn"
                    onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'transparent'; }}
                  >
                    ✕
                  </button>
                </div>

                {/* Health status + language */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                  <CoverageDot pct={health?.coverage_pct ?? null} />
                  <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'DM Mono, monospace' }}>
                    {health?.coverage_pct != null
                      ? `${Math.round(health.coverage_pct)}% coverage`
                      : health?.loading ? 'loading…' : 'not analyzed'}
                  </span>
                  {health?.stale_count != null && health.stale_count > 0 && (
                    <span style={{ fontSize: 10, color: 'var(--amber)', fontWeight: 600, marginLeft: 'auto' }}>
                      {health.stale_count} stale
                    </span>
                  )}
                  {repo.language && (
                    <span style={{
                      fontSize: 10, fontFamily: 'DM Mono, monospace',
                      color: 'var(--text-3)',
                      marginLeft: 'auto',
                    }}>
                      {repo.language}
                    </span>
                  )}
                </div>

                {/* Description */}
                {repo.description && (
                  <p style={{
                    fontSize: 11.5, color: 'var(--text-3)',
                    marginBottom: 8, lineHeight: 1.5,
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {repo.description}
                  </p>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {actions.map(({ label, action, busy }) => (
                    <button
                      key={label}
                      onClick={e => { e.stopPropagation(); action(); }}
                      disabled={busy}
                      style={{
                        fontSize: 11, fontWeight: 500,
                        fontFamily: 'DM Sans, sans-serif',
                        padding: '3px 8px', borderRadius: 6,
                        border: '1px solid var(--border)',
                        background: 'var(--surface-3)',
                        color: 'var(--text-2)',
                        cursor: 'pointer', transition: 'all 0.12s',
                        opacity: busy ? 0.4 : 1,
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'var(--amber-border)';
                        e.currentTarget.style.color = 'var(--amber)';
                        e.currentTarget.style.background = 'var(--amber-dim)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.color = 'var(--text-2)';
                        e.currentTarget.style.background = 'var(--surface-3)';
                      }}
                    >
                      {busy ? '…' : label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sidebar hover opacity fix */}
      <style>{`.delete-btn { opacity: 0 !important; } div:hover > div > .delete-btn { opacity: 1 !important; }`}</style>
    </aside>
  );
}