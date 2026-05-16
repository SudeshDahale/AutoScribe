import type { Repo, RepoHealth, ParsedFile, Docstring, SearchResult, IndexStats, StalenessReport, Analytics, WebhookStatus } from '../types';
import { CoverageRing } from '../components/ui/CoverageRing';
import { ParsePanel } from '../components/panels/ParsePanel';
import { ReadmePanel } from '../components/panels/ReadmePanel';
import { DocstringsPanel } from '../components/panels/DocstringsPanel';
import { SearchPanel } from '../components/panels/SearchPanel';
import { AnalyticsPanel } from '../components/panels/AnalyticsPanel';
import { StalenessPanel } from '../components/panels/StalenessPanel';
import { WebhookPanel } from '../components/panels/WebhookPanel';

export function RepositoriesPage({
  repos, healthScores, user, loading, error, repoInput, adding,
  selectedRepo, rightPanel, onAddRepo, onRepoInputChange, onSelectRepo,
  onDeleteRepo, onParseRepo, onGenerateReadme, onOpenSearch, onOpenAnalytics,
  onOpenWebhook, onOpenStaleness, onOpenPromptEditor, ...rest
}: any) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const username = user?.username ?? 'there';

  const totalDrifting = Object.values(healthScores as Record<number, RepoHealth>)
    .reduce((a, h) => a + (h.stale_count ?? 0), 0);

  const avgCoverage = (() => {
    const vals = Object.values(healthScores as Record<number, RepoHealth>)
      .filter(h => h.coverage_pct !== null);
    return vals.length
      ? Math.round(vals.reduce((a, h) => a + (h.coverage_pct ?? 0), 0) / vals.length)
      : 0;
  })();

  if (selectedRepo && rightPanel !== 'empty') {
    return (
      <RepoDetailView
        selectedRepo={selectedRepo}
        rightPanel={rightPanel}
        healthScores={healthScores}
        onBack={() => rest.onSetRightPanel('empty')}
        onParseRepo={onParseRepo}
        onGenerateReadme={onGenerateReadme}
        onOpenSearch={onOpenSearch}
        onOpenAnalytics={onOpenAnalytics}
        onOpenWebhook={onOpenWebhook}
        onOpenStaleness={onOpenStaleness}
        {...rest}
      />
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 32px' }}>
      {/* Hero */}
      <div style={{ marginBottom: 32 }}>
        <p style={{
          fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--text-3)',
          letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8,
        }}>
          Overview
        </p>
        <h1 style={{ fontSize: 48, fontFamily: 'Syne, sans-serif', fontWeight: 700, margin: '0 0 12px', lineHeight: 1.1 }}>
          {greeting}, <em style={{ color: 'var(--lime)', fontStyle: 'italic' }}>{username}.</em>
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 14, color: 'var(--text-2)', margin: 0 }}>
            {repos.length} {repos.length === 1 ? 'repository' : 'repositories'} indexed
            {totalDrifting > 0 && (
              <> · <span style={{ color: 'var(--orange)' }}>{totalDrifting} drifting</span></>
            )}
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-3)', fontSize: 13, pointerEvents: 'none',
              }}>
                ⌕
              </span>
              <input
                className="input-base"
                placeholder="Quick search"
                style={{ paddingLeft: 30, width: 180 }}
              />
            </div>
            <button
              className="btn-primary"
              onClick={() => {
                const url = prompt('Enter GitHub repo URL or owner/repo:');
                if (url) {
                  const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                  onRepoInputChange(url);
                  setTimeout(() => onAddRepo(fakeEvent), 50);
                }
              }}
            >
              + Connect repository
            </button>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 40 }}>
        {[
          { label: 'AVG COVERAGE', value: repos.length ? `${avgCoverage}%` : '—', sub: '+6 this week', color: 'var(--lime)' },
          { label: 'DRIFTING DOCS', value: String(totalDrifting || '—'), sub: `across ${repos.length} repos`, color: 'var(--orange)' },
          { label: 'AUTO-RUNS · 7D', value: '—', sub: '98% within SLA', color: 'var(--text-1)' },
          { label: 'TOKENS USED · 30D', value: '—', sub: '$0.00 in spend', color: 'var(--text-1)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '20px 24px' }}>
            <p style={{
              fontSize: 10, fontFamily: 'DM Mono, monospace', color: 'var(--text-3)',
              letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12, margin: '0 0 12px',
            }}>
              {s.label}
            </p>
            <p style={{
              fontSize: 36, fontFamily: 'Syne, sans-serif', fontWeight: 700,
              color: s.color, margin: '0 0 8px', lineHeight: 1,
            }}>
              {s.value}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Repos + Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        {/* Repo list */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontFamily: 'Syne, sans-serif', fontWeight: 700, margin: 0 }}>Repositories</h2>
            <span style={{
              fontSize: 10, fontFamily: 'DM Mono, monospace', color: 'var(--text-3)',
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              Sorted by recent activity
            </span>
          </div>

          {/* Add repo form */}
          <form onSubmit={onAddRepo} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              className="input-base"
              placeholder="owner/repo"
              value={repoInput}
              onChange={e => onRepoInputChange(e.target.value)}
              disabled={adding}
            />
            <button type="submit" className="btn-ghost" disabled={adding || !repoInput.trim()}>
              {adding ? '…' : 'Add'}
            </button>
          </form>
          {error && <p style={{ color: '#f87171', fontSize: 12, marginBottom: 12 }}>⚠ {error}</p>}

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div className="spinner" />
            </div>
          ) : repos.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>
              <p style={{ fontSize: 32, margin: '0 0 12px' }}>◫</p>
              <p style={{ fontSize: 14, margin: 0 }}>No repositories yet. Add one above.</p>
            </div>
          ) : repos.map((repo: Repo) => {
            const h = healthScores[repo.id];
            const status = h?.coverage_pct != null
              ? (h.coverage_pct >= 70 ? 'HEALTHY' : 'DRIFTING')
              : null;

            return (
              <div
                key={repo.id}
                className="card-hover"
                style={{ padding: '16px 20px', marginBottom: 10, cursor: 'pointer' }}
                onClick={() => { onSelectRepo(repo); onParseRepo(repo); }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  {/* Git icon */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77A5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                  </svg>
                  <span style={{ fontSize: 13, color: 'var(--text-2)', fontFamily: 'DM Mono, monospace' }}>
                    {repo.full_name?.split('/')[0]}
                  </span>
                  <span style={{ color: 'var(--text-3)' }}>/</span>
                  <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'DM Mono, monospace', color: 'var(--text-1)' }}>
                    {repo.full_name?.split('/')[1] ?? repo.full_name}
                  </span>
                  {status && (
                    <span className={status === 'HEALTHY' ? 'badge-healthy' : 'badge-drifting'}>
                      <span className={status === 'HEALTHY' ? 'dot-lime' : 'dot-orange'} style={{ marginRight: 4 }} />
                      {status}
                    </span>
                  )}
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <CoverageRing pct={h?.coverage_pct ?? null} size={44} />
                    {h?.stale_count != null && h.stale_count > 0 && (
                      <div style={{ textAlign: 'center' }}>
                        <p style={{
                          fontSize: 10, color: 'var(--text-3)', fontFamily: 'DM Mono, monospace',
                          margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.06em',
                        }}>
                          Stale
                        </p>
                        <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--orange)', margin: 0, fontFamily: 'Syne, sans-serif' }}>
                          {h.stale_count}
                        </p>
                      </div>
                    )}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2">
                      <path d="M7 17 17 7M7 7h10v10" />
                    </svg>
                  </div>
                </div>

                {repo.description && (
                  <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '4px 0 8px', lineHeight: 1.5 }}>
                    {repo.description}
                  </p>
                )}

                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  fontSize: 12, color: 'var(--text-3)', fontFamily: 'DM Mono, monospace',
                }}>
                  {repo.language && <span style={{ color: 'var(--lime)' }}>{repo.language}</span>}
                  {repo.stars != null && <span>⭐ {repo.stars}</span>}
                  <span style={{ marginLeft: 'auto', fontSize: 11 }}>
                    sync {repo.last_pushed_at
                      ? new Date(repo.last_pushed_at).toLocaleDateString()
                      : 'recently'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Activity feed */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontFamily: 'Syne, sans-serif', fontWeight: 700, margin: 0 }}>Activity</h2>
            <span style={{
              fontSize: 10, fontFamily: 'DM Mono, monospace', color: 'var(--lime)',
              letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
            }}>
              Live feed
            </span>
          </div>
          <div className="card" style={{ padding: '12px 0' }}>
            {repos.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '24px 16px' }}>
                Activity will appear here as your repos regenerate.
              </p>
            ) : repos.slice(0, 5).map((repo: Repo) => (
              <div key={repo.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '10px 16px', borderBottom: '1px solid var(--border)',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7, background: 'var(--surface-4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77A5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--lime)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {repo.full_name}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>
                    Indexed · {repo.language ?? 'Unknown'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Repo Detail View ────────────────────────────────────────────────────────

function RepoDetailView({
  selectedRepo, rightPanel, healthScores, onBack,
  onParseRepo, onGenerateReadme, onOpenSearch, onOpenAnalytics,
  onOpenWebhook, onOpenStaleness, ...rest
}: any) {
  const h = healthScores[selectedRepo.id];
  const status = h?.coverage_pct != null
    ? (h.coverage_pct >= 70 ? 'HEALTHY' : 'DRIFTING')
    : null;

  const tabs = ['overview', 'documents', 'drift', 'webhooks', 'settings'] as const;
  const tabToPanel: Record<string, string> = {
    overview: 'parse',
    documents: 'parse',
    drift: 'staleness',
    webhooks: 'webhook',
    settings: 'webhook',
  };
  const activeTab = Object.entries(tabToPanel).find(([, v]) => v === rightPanel)?.[0] ?? 'overview';

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px 0' }}>
      {/* Breadcrumb */}
      <button
        onClick={onBack}
        style={{
          background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer',
          fontSize: 11, fontFamily: 'DM Mono, monospace', letterSpacing: '0.06em',
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, padding: 0,
          textTransform: 'uppercase',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-1)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; }}
      >
        ← All Repositories
      </button>

      {/* Repo header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77A5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
            </svg>
            <span style={{ fontSize: 14, color: 'var(--text-2)', fontFamily: 'DM Mono, monospace' }}>
              {selectedRepo.full_name?.split('/')[0]}
            </span>
            <span style={{ color: 'var(--text-3)' }}>/</span>
            <span style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Syne, sans-serif' }}>
              {selectedRepo.full_name?.split('/')[1] ?? selectedRepo.full_name}
            </span>
            {status && (
              <span className={status === 'HEALTHY' ? 'badge-healthy' : 'badge-drifting'}>
                <span className={status === 'HEALTHY' ? 'dot-lime' : 'dot-orange'} style={{ marginRight: 4 }} />
                {status}
              </span>
            )}
          </div>
          {selectedRepo.description && (
            <p style={{ fontSize: 14, color: 'var(--text-2)', margin: 0 }}>
              {selectedRepo.description}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <button className="btn-ghost" onClick={() => onParseRepo(selectedRepo)}>
            ↻ Re-index
          </button>
          <button className="btn-primary" onClick={() => onGenerateReadme(selectedRepo)}>
            ▷ Regenerate all
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        {tabs.map(tab => {
          const isActive = tab === activeTab;
          const label = tab.charAt(0).toUpperCase() + tab.slice(1);
          return (
            <button
              key={tab}
              className={isActive ? 'tab-active' : ''}
              onClick={() => rest.onSetRightPanel(tabToPanel[tab])}
              style={{
                padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 14, color: isActive ? 'var(--text-1)' : 'var(--text-2)',
                fontFamily: 'DM Sans, sans-serif', fontWeight: isActive ? 600 : 400,
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'var(--text-1)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'var(--text-2)'; }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Panel content */}
      <div style={{ paddingTop: 24, paddingBottom: 48 }}>
        {rightPanel === 'parse' && (
          <ParsePanel {...rest} repoName={selectedRepo?.full_name} />
        )}
        {rightPanel === 'readme' && (
          <ReadmePanel {...rest} repoId={selectedRepo?.id} />
        )}
        {rightPanel === 'docstrings' && (
          <DocstringsPanel {...rest} />
        )}
        {rightPanel === 'search' && (
          <SearchPanel {...rest} />
        )}
        {rightPanel === 'analytics' && (
          <AnalyticsPanel {...rest} onViewStaleness={onOpenStaleness} selectedRepo={selectedRepo} />
        )}
        {rightPanel === 'staleness' && (
          <StalenessPanel {...rest} repoName={selectedRepo?.full_name} />
        )}
        {rightPanel === 'webhook' && (
          <WebhookPanel {...rest} />
        )}
      </div>
    </div>
  );
}