import { useState } from 'react';
import type { Repo, RepoHealth } from '../types';
import { CoverageRing } from '../components/ui/CoverageRing';
import { ParsePanel } from '../components/panels/ParsePanel';
import { ReadmePanel } from '../components/panels/ReadmePanel';
import { DocstringsPanel } from '../components/panels/DocstringsPanel';
import { SearchPanel } from '../components/panels/SearchPanel';
import { AnalyticsPanel } from '../components/panels/AnalyticsPanel';
import { StalenessPanel } from '../components/panels/StalenessPanel';
import { WebhookPanel } from '../components/panels/WebhookPanel';

// ─── Connect Repository Modal ────────────────────────────────────────────────

function ConnectRepoModal({
  open, onClose, repoInput, onRepoInputChange, onAddRepo, adding, error,
}: {
  open: boolean; onClose: () => void;
  repoInput: string; onRepoInputChange: (v: string) => void;
  onAddRepo: (e: React.FormEvent) => void; adding: boolean; error: string;
}) {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%', maxWidth: 520,
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: 32,
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'var(--lime-dim)', border: '1px solid var(--lime-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--lime)" strokeWidth="2">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77A5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
              </div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, margin: 0 }}>Connect repository</h2>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
              Paste a GitHub URL or use <code style={{ fontFamily: 'DM Mono, monospace', color: 'var(--lime)', fontSize: 12 }}>owner/repo</code> format.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: '1px solid var(--border)', color: 'var(--text-3)',
              cursor: 'pointer', borderRadius: 8, width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
              flexShrink: 0,
            }}
          >✕</button>
        </div>

        <form onSubmit={(e) => { onAddRepo(e); }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block', fontSize: 11, fontFamily: 'DM Mono, monospace',
              color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
            }}>
              Repository
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-3)', fontFamily: 'DM Mono, monospace', fontSize: 13,
              }}>
                github.com/
              </span>
              <input
                className="input-base"
                placeholder="owner/repo"
                value={repoInput}
                onChange={e => onRepoInputChange(e.target.value)}
                disabled={adding}
                autoFocus
                style={{ paddingLeft: 100 }}
              />
            </div>
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, marginBottom: 16,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              color: '#ef4444', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              ⚠ {error}
            </div>
          )}

          {/* Examples */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Examples
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['vercel/next.js', 'facebook/react', 'microsoft/vscode'].map(ex => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => onRepoInputChange(ex)}
                  style={{
                    padding: '4px 10px', borderRadius: 6,
                    background: 'var(--surface-3)', border: '1px solid var(--border)',
                    color: 'var(--text-2)', fontSize: 12, fontFamily: 'DM Mono, monospace',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--lime-border)'; e.currentTarget.style.color = 'var(--lime)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)'; }}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={adding || !repoInput.trim()}
              style={{ flex: 2 }}
            >
              {adding ? '…Connecting' : '+ Connect repository'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Settings Panel ──────────────────────────────────────────────────────────

function SettingsPanel({ selectedRepo, webhookAutoRegen, onAutoRegenToggle, onDeleteRepo }: {
  selectedRepo: Repo; webhookAutoRegen: boolean; onAutoRegenToggle: () => void; onDeleteRepo: (id: number) => void;
}) {
  const fields = [
    { label: 'DISPLAY NAME', value: selectedRepo.full_name?.split('/')[1] ?? selectedRepo.full_name },
    { label: 'DEFAULT BRANCH', value: 'main' },
    { label: 'PROMPT SET', value: 'default' },
  ];

  return (
    <div style={{ maxWidth: 740 }}>
      {fields.map(f => (
        <div key={f.label} className="card" style={{ padding: '20px 24px', marginBottom: 12 }}>
          <p style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px' }}>
            {f.label}
          </p>
          <p style={{ fontSize: 18, fontWeight: 500, margin: 0, fontFamily: 'DM Sans, sans-serif' }}>{f.value}</p>
        </div>
      ))}

      {/* Auto-regen toggle */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 16, fontWeight: 600, margin: '0 0 4px', fontFamily: 'DM Sans, sans-serif' }}>Auto-regenerate on push</p>
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>Re-run drafts the moment a webhook arrives.</p>
        </div>
        <button
          onClick={onAutoRegenToggle}
          style={{
            position: 'relative', width: 48, height: 26, borderRadius: 99,
            background: webhookAutoRegen ? 'var(--lime)' : 'var(--surface-4)',
            border: 'none', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
          }}
        >
          <span style={{
            position: 'absolute', top: 3, left: webhookAutoRegen ? 25 : 3, width: 20, height: 20,
            borderRadius: '50%', background: webhookAutoRegen ? '#0a0f02' : 'var(--text-3)',
            transition: 'left 0.2s',
          }} />
        </button>
      </div>

      {/* Danger zone */}
      <div className="card" style={{ padding: '20px 24px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.04)' }}>
        <p style={{ fontSize: 16, fontWeight: 600, color: '#ef4444', margin: '0 0 6px', fontFamily: 'Syne, sans-serif' }}>Disconnect repository</p>
        <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '0 0 16px' }}>
          Stops indexing, removes webhook, deletes embeddings. Generated docs remain in your repo.
        </p>
        <button
          onClick={() => {
            if (confirm('Disconnect this repository? This cannot be undone.')) {
              onDeleteRepo(selectedRepo.id);
            }
          }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', borderRadius: 8,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            color: '#ef4444', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
        >
          ⚙ Disconnect
        </button>
      </div>
    </div>
  );
}

// ─── Documents Panel ─────────────────────────────────────────────────────────

function DocumentsPanel({ parseResults, onGenerateDocstrings, parsing, parseError }: any) {
  const [filter, setFilter] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);

  const filtered = parseResults.filter((f: any) =>
    !filter || f.file_path.toLowerCase().includes(filter.toLowerCase())
  );

  const getStatusBadge = (f: any) => {
    if (!f.symbols || f.symbols.length === 0) return { label: 'MISSING', cls: 'badge-missing' };
    if (f.symbols.some((s: any) => !s.docstring)) return { label: 'DRIFTED', cls: 'badge-drifting' };
    return { label: 'FRESH', cls: 'badge-fresh' };
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 0, minHeight: 500, border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      {/* File list */}
      <div style={{ borderRight: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
          <input
            className="input-base"
            placeholder="filter paths…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}
          />
        </div>
        <div className="scrollbar-thin" style={{ flex: 1, overflowY: 'auto' }}>
          {parsing ? (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <div className="spinner" />
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 12 }}>Parsing…</p>
            </div>
          ) : parseError ? (
            <p style={{ padding: 16, color: '#ef4444', fontSize: 12 }}>{parseError}</p>
          ) : filtered.length === 0 ? (
            <p style={{ padding: 24, color: 'var(--text-3)', fontSize: 12, textAlign: 'center' }}>No files found. Parse the repository first.</p>
          ) : filtered.map((f: any) => {
            const { label, cls } = getStatusBadge(f);
            const isSelected = selectedFile?.file_path === f.file_path;
            return (
              <div
                key={f.file_path}
                onClick={() => setSelectedFile(f)}
                style={{
                  padding: '10px 14px', cursor: 'pointer',
                  borderBottom: '1px solid var(--border)',
                  background: isSelected ? 'var(--surface-3)' : 'transparent',
                  transition: 'background 0.1s',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--surface-3)'; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="var(--text-3)">
                      <path d="M2 2h8l4 4v8H2z" />
                    </svg>
                    <span style={{
                      fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--text-1)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {f.file_path}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span className={cls} style={{ fontSize: 10 }}>{label}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}>
                      {f.symbols?.length > 0 ? (f.symbols[0].type ?? 'module') : 'module'}
                    </span>
                  </div>
                </div>
                <span style={{ color: 'var(--text-3)', fontSize: 14 }}>›</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right panel: selected file */}
      <div style={{ background: 'var(--surface)', padding: 28 }}>
        {!selectedFile ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            Select a file to view its documentation
          </div>
        ) : (() => {
          const sym = selectedFile.symbols?.[0];
          return (
            <div>
              <p style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>
                {sym?.type ?? 'module'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontFamily: 'DM Mono, monospace', fontWeight: 600, margin: 0 }}>
                  {selectedFile.file_path}
                </h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn-primary"
                    style={{ fontSize: 12 }}
                    onClick={() => onGenerateDocstrings(selectedFile)}
                  >
                    ✦ Regenerate
                  </button>
                </div>
              </div>

              {sym?.docstring ? (
                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                    Generated Docstring
                  </p>
                  <p style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.7, margin: '0 0 16px' }}>
                    {sym.docstring}
                  </p>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '8px 14px', borderRadius: 8,
                    background: 'var(--surface-3)', border: '1px solid var(--border)',
                    fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--text-2)',
                  }}>
                    Written by <span style={{ color: 'var(--lime)', fontWeight: 600 }}>AutoScribe v0.3</span>
                    &nbsp;·&nbsp;grounded in {selectedFile.symbols?.length ?? 0} surrounding symbols
                    &nbsp;·&nbsp;today
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '24px', borderRadius: 12, background: 'var(--surface-2)',
                  border: '1px solid var(--border)', marginBottom: 24, color: 'var(--text-3)',
                  fontSize: 13,
                }}>
                  No docstring yet. Click Regenerate to generate one.
                </div>
              )}

              {sym?.source && (
                <div>
                  <p style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                    Source Excerpt
                  </p>
                  <pre style={{
                    padding: '16px', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)',
                    fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--text-2)',
                    overflow: 'auto', margin: 0, lineHeight: 1.7,
                  }}>
                    {sym.source.slice(0, 400)}
                  </pre>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ─── Main RepositoriesPage ────────────────────────────────────────────────────

export function RepositoriesPage({
  repos, healthScores, user, loading, error, repoInput, adding,
  selectedRepo, rightPanel, onAddRepo, onRepoInputChange, onSelectRepo,
  onDeleteRepo, onParseRepo, onGenerateReadme, onOpenSearch, onOpenAnalytics,
  onOpenWebhook, onOpenStaleness, onOpenPromptEditor, ...rest
}: any) {
  const [showConnectModal, setShowConnectModal] = useState(false);

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
        onDeleteRepo={onDeleteRepo}
        {...rest}
      />
    );
  }

  return (
    <>
      <ConnectRepoModal
        open={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        repoInput={repoInput}
        onRepoInputChange={onRepoInputChange}
        onAddRepo={(e) => { onAddRepo(e); }}
        adding={adding}
        error={error}
      />

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
                }}>⌕</span>
                <input
                  className="input-base"
                  placeholder="Quick search"
                  style={{ paddingLeft: 30, width: 180 }}
                />
              </div>
              <button className="btn-primary" onClick={() => setShowConnectModal(true)}>
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
                letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 12px',
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

        {/* Repos + Activity grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32 }}>
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

            {loading ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <div className="spinner" />
              </div>
            ) : repos.length === 0 ? (
              <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>
                <p style={{ fontSize: 32, margin: '0 0 12px' }}>◫</p>
                <p style={{ fontSize: 14, margin: '0 0 20px' }}>No repositories yet.</p>
                <button className="btn-primary" onClick={() => setShowConnectModal(true)}>
                  + Connect your first repository
                </button>
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
                          <p style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', margin: '0 0 2px' }}>Stale</p>
                          <p style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: 'var(--orange)', margin: 0, lineHeight: 1 }}>{h.stale_count}</p>
                        </div>
                      )}
                      <span style={{ color: 'var(--text-3)', fontSize: 16 }}>↗</span>
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
    </>
  );
}

// ─── Repo Detail View ────────────────────────────────────────────────────────

function RepoDetailView({
  selectedRepo, rightPanel, healthScores, onBack,
  onParseRepo, onGenerateReadme, onOpenSearch, onOpenAnalytics,
  onOpenWebhook, onOpenStaleness, onDeleteRepo, ...rest
}: any) {
  const h = healthScores[selectedRepo.id];
  const status = h?.coverage_pct != null
    ? (h.coverage_pct >= 70 ? 'HEALTHY' : 'DRIFTING')
    : null;

  const tabs = ['overview', 'documents', 'drift', 'webhooks', 'settings'] as const;
  const tabToPanel: Record<string, string> = {
    overview: 'parse',
    documents: 'documents',
    drift: 'staleness',
    webhooks: 'webhook',
    settings: 'settings',
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
        {rightPanel === 'documents' && (
          <DocumentsPanel {...rest} />
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
        {rightPanel === 'settings' && (
          <SettingsPanel
            selectedRepo={selectedRepo}
            webhookAutoRegen={rest.webhookAutoRegen}
            onAutoRegenToggle={rest.onAutoRegenToggle}
            onDeleteRepo={onDeleteRepo}
          />
        )}
      </div>
    </div>
  );
}