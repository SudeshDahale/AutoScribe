import { useState, useRef } from 'react';
import { API } from '../constants';
import type { Repo, RepoHealth } from '../types';
import { CoverageRing } from '../components/ui/CoverageRing';
import { ParsePanel } from '../components/panels/ParsePanel';
import { ReadmePanel } from '../components/panels/ReadmePanel';
import { DocstringsPanel } from '../components/panels/DocstringsPanel';
import { SearchPanel } from '../components/panels/SearchPanel';
import { AnalyticsPanel } from '../components/panels/AnalyticsPanel';
import { StalenessPanel } from '../components/panels/StalenessPanel';
import { WebhookPanel } from '../components/panels/WebhookPanel';
import { MarkdownRenderer } from '../components/ui/MarkdownRenderer';

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


// ─── Documents Panel ──────────────────────────────────────────────────────────
function DocumentsPanel({ parseResults, onGenerateDocstrings, parsing, parseError, user, selectedRepo, readme, onCopy, copied, onRegenerate, generating }: any) {
  const [filter, setFilter] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [activeDocTab, setActiveDocTab] = useState<'files' | 'readme'>('files');
  const [exampleFile, setExampleFile] = useState<string>('');
  const [exampleLabel, setExampleLabel] = useState<string>('');
  const [showExampleUpload, setShowExampleUpload] = useState(false);
  const [savingExample, setSavingExample] = useState(false);
  const [exampleSaved, setExampleSaved] = useState(false);
  const [exampleError, setExampleError] = useState('');
  const [generatingWithExample, setGeneratingWithExample] = useState(false);
  const [viewMode, setViewMode] = useState<'rendered' | 'raw'>('rendered');
  const [showCommit, setShowCommit] = useState(false);
  const [commitMsg, setCommitMsg] = useState('docs: update README via AutoScribe');
  const [createPR, setCreatePR] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState<any>(null);
  const [commitError, setCommitError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const exampleRef = useRef<HTMLInputElement>(null);

  const filtered = parseResults.filter((f: any) =>
    !filter || f.file_path.toLowerCase().includes(filter.toLowerCase())
  );

  const getStatusBadge = (f: any) => {
    if (!f.symbols || f.symbols.length === 0) return { label: 'MISSING', color: '#ef4444', bg: 'rgba(239,68,68,0.08)' };
    if (f.symbols.some((s: any) => !s.docstring)) return { label: 'DRIFTED', color: '#f97316', bg: 'rgba(249,115,22,0.08)' };
    return { label: 'FRESH', color: '#a3e635', bg: 'rgba(163,230,53,0.08)' };
  };

  const handleExampleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setExampleFile(ev.target?.result as string ?? '');
    reader.readAsText(file);
    if (!exampleLabel) setExampleLabel(file.name.replace(/\.[^.]+$/, '') + ' style');
  };

  const handleSaveExampleAndGenerate = async () => {
    if (!selectedRepo || !exampleFile.trim() || !user) return;
    setGeneratingWithExample(true); setExampleError('');
    try {
      const res = await fetch(`${API}/prompt-editor/generate-with-reference`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.access_token}` },
        body: JSON.stringify({ repo_id: selectedRepo.id, doc_type: 'readme', reference_text: exampleFile }),
      });
      if (!res.ok) { setExampleError('Failed to generate with example file.'); }
      else {
        setExampleSaved(true);
        if (onRegenerate) onRegenerate(exampleFile);
        setShowExampleUpload(false);
        setTimeout(() => setExampleSaved(false), 3000);
      }
    } catch { setExampleError('Network error.'); }
    setGeneratingWithExample(false);
  };

  const handleCommit = async () => {
    if (!selectedRepo || !readme || !user) return;
    setCommitting(true); setCommitError(''); setCommitResult(null);
    try {
      const res = await fetch(`${API}/prompt-editor/create-pr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.access_token}` },
        body: JSON.stringify({ repo_id: selectedRepo.id, doc_type: 'readme', content: readme, commit_message: commitMsg, create_pr: createPR }),
      });
      if (!res.ok) { const d = await res.json(); setCommitError(d.detail || 'Failed.'); }
      else { const data = await res.json(); setCommitResult(data); }
    } catch { setCommitError('Network error.'); }
    setCommitting(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 600 }}>
      {/* Sub-tabs: Files / README */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        {[
          { id: 'files', label: '⬡ Files & Docstrings' },
          { id: 'readme', label: '📄 README' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveDocTab(t.id as any)}
            style={{
              padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, fontFamily: 'DM Mono, monospace',
              color: activeDocTab === t.id ? 'var(--text-1)' : 'var(--text-3)',
              borderBottom: activeDocTab === t.id ? '2px solid var(--lime)' : '2px solid transparent',
              letterSpacing: '0.04em', transition: 'all 0.15s', marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── FILES TAB ── */}
      {activeDocTab === 'files' && (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 0, border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', flex: 1 }}>
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
                <p style={{ padding: 24, color: 'var(--text-3)', fontSize: 12, textAlign: 'center' }}>
                  No files found. Parse the repository first.
                </p>
              ) : filtered.map((f: any) => {
                const { label, color, bg } = getStatusBadge(f);
                const isSelected = selectedFile?.file_path === f.file_path;
                const parts = f.file_path.split('/');
                const fileName = parts[parts.length - 1];
                const dirPath = parts.slice(0, -1).join('/');
                return (
                  <div
                    key={f.file_path}
                    onClick={() => setSelectedFile(f)}
                    style={{
                      padding: '10px 14px', cursor: 'pointer',
                      borderBottom: '1px solid var(--border)',
                      background: isSelected ? 'var(--surface-3)' : 'transparent',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {dirPath && (
                      <p style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: 'var(--text-3)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {dirPath}/
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <span style={{ fontSize: 13, fontFamily: 'DM Mono, monospace', color: isSelected ? 'var(--lime)' : 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {fileName}
                      </span>
                      <span style={{ fontSize: 9, fontFamily: 'DM Mono, monospace', padding: '2px 6px', borderRadius: 4, background: bg, color, flexShrink: 0, letterSpacing: '0.06em' }}>
                        {label}
                      </span>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '3px 0 0', fontFamily: 'DM Mono, monospace' }}>
                      {f.symbols?.length ?? 0} symbols
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* File detail */}
          <div className="scrollbar-thin" style={{ background: 'var(--surface)', padding: 28, overflowY: 'auto' }}>
            {!selectedFile ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, color: 'var(--text-3)' }}>
                <p style={{ fontSize: 32, margin: 0 }}>⬡</p>
                <p style={{ fontSize: 14, margin: 0 }}>Select a file to view its documentation</p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 12 }}>
                  <div>
                    <p style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>
                      {selectedFile.language ?? 'File'}
                    </p>
                    <h2 style={{ fontSize: 16, fontFamily: 'DM Mono, monospace', fontWeight: 600, margin: 0, color: 'var(--text-1)', wordBreak: 'break-all' }}>
                      {selectedFile.file_path}
                    </h2>
                    <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '4px 0 0' }}>
                      {selectedFile.symbols?.length ?? 0} symbols detected
                    </p>
                  </div>
                  <button
                    className="btn-primary"
                    style={{ fontSize: 12, flexShrink: 0 }}
                    onClick={() => onGenerateDocstrings(selectedFile)}
                  >
                    ✦ Regenerate docs
                  </button>
                </div>

                {/* All symbols */}
                {selectedFile.symbols?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {selectedFile.symbols.map((sym: any, idx: number) => (
                      <div key={idx} style={{ padding: '16px 20px', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: sym.docstring ? 10 : 0 }}>
                          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, fontWeight: 700, color: sym.type === 'function' ? '#60a5fa' : sym.type === 'class' ? '#c084fc' : '#a3e635' }}>
                            {sym.type === 'function' ? 'ƒ' : sym.type === 'class' ? '◈' : '·'}
                          </span>
                          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>{sym.name}</span>
                          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text-3)', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {sym.type}
                          </span>
                          {sym.line && <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 'auto', fontFamily: 'DM Mono, monospace' }}>L{sym.line}</span>}
                        </div>
                        {sym.docstring ? (
                          <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7, margin: 0, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                            {sym.docstring}
                          </p>
                        ) : (
                          <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0, fontStyle: 'italic', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                            No docstring yet
                          </p>
                        )}
                        {sym.source && (
                          <details style={{ marginTop: 10 }}>
                            <summary style={{ fontSize: 11, color: 'var(--text-3)', cursor: 'pointer', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              Source
                            </summary>
                            <pre style={{ marginTop: 8, padding: '12px 14px', borderRadius: 8, background: 'var(--surface-3)', border: '1px solid var(--border)', fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--text-2)', overflow: 'auto', lineHeight: 1.6 }}>
                              {sym.source.slice(0, 600)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: 24, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 13, textAlign: 'center' }}>
                    No symbols detected in this file.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── README TAB ── */}
      {activeDocTab === 'readme' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* README toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {/* Example file upload button */}
            <button
              onClick={() => setShowExampleUpload(v => !v)}
              style={{
                padding: '6px 12px', borderRadius: 8,
                background: showExampleUpload ? 'rgba(96,165,250,0.08)' : 'var(--surface-3)',
                border: `1px solid ${showExampleUpload ? 'rgba(96,165,250,0.3)' : 'var(--border)'}`,
                color: showExampleUpload ? '#60a5fa' : 'var(--text-2)',
                cursor: 'pointer', fontSize: 12, fontFamily: 'DM Mono, monospace',
              }}
            >
              📎 Example file
            </button>

            {readme && (
              <>
                <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface-3)' }}>
                  {(['rendered', 'raw'] as const).map(mode => (
                    <button key={mode} onClick={() => setViewMode(mode)} style={{
                      padding: '6px 12px', background: viewMode === mode ? 'var(--surface-4)' : 'transparent',
                      border: 'none', cursor: 'pointer', fontSize: 12,
                      color: viewMode === mode ? 'var(--text-1)' : 'var(--text-3)',
                      fontFamily: 'DM Mono, monospace', transition: 'all 0.15s',
                    }}>
                      {mode === 'rendered' ? '⬡ Preview' : '{ } Raw'}
                    </button>
                  ))}
                </div>

                <button onClick={() => { if (onCopy) onCopy(readme); }} style={{
                  padding: '6px 12px', borderRadius: 8,
                  background: copied ? 'rgba(163,230,53,0.08)' : 'var(--surface-3)',
                  border: `1px solid ${copied ? 'rgba(163,230,53,0.3)' : 'var(--border)'}`,
                  color: copied ? 'var(--lime)' : 'var(--text-2)',
                  cursor: 'pointer', fontSize: 12, fontFamily: 'DM Mono, monospace',
                }}>
                  {copied ? '✓ Copied' : '📋 Copy MD'}
                </button>

                <button onClick={() => { setShowCommit(v => !v); setCommitResult(null); setCommitError(''); }} style={{
                  padding: '6px 14px', borderRadius: 8,
                  background: showCommit ? 'var(--lime)' : 'var(--surface-3)',
                  border: `1px solid ${showCommit ? 'var(--lime)' : 'var(--border)'}`,
                  color: showCommit ? '#0a0f02' : 'var(--text-1)',
                  cursor: 'pointer', fontSize: 12, fontFamily: 'DM Mono, monospace', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77A5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                  </svg>
                  Commit to GitHub
                </button>
              </>
            )}

            {generating && <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'DM Mono, monospace' }}>⟳ Generating…</span>}
          </div>

          {/* Example file upload panel */}
          {showExampleUpload && (
            <div style={{ padding: 16, borderRadius: 10, marginBottom: 16, background: 'rgba(96,165,250,0.04)', border: '1px solid rgba(96,165,250,0.15)' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', margin: '0 0 4px', fontFamily: 'Syne, sans-serif' }}>
                📎 Generate from example file
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 12px' }}>
                Upload a README you like — AutoScribe will match its structure and tone using your repo's actual codebase.
              </p>
              <input ref={exampleRef} type="file" accept=".md,.txt,.rst" style={{ display: 'none' }} onChange={handleExampleFileUpload} />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                <button onClick={() => { if (exampleRef.current) exampleRef.current.click(); }} style={{
                  padding: '7px 14px', borderRadius: 8, background: 'var(--surface-3)', border: '1px solid var(--border)',
                  color: 'var(--text-2)', cursor: 'pointer', fontSize: 12,
                }}>
                  📁 Upload file
                </button>
                {exampleFile && <span style={{ fontSize: 12, color: '#60a5fa', fontFamily: 'DM Mono, monospace' }}>✓ {exampleLabel || 'File loaded'} ({exampleFile.length} chars)</span>}
              </div>
              {exampleFile && (
                <textarea
                  value={exampleFile}
                  onChange={e => setExampleFile(e.target.value)}
                  placeholder="Or paste your example README here…"
                  style={{ width: '100%', height: 100, padding: '8px 12px', borderRadius: 8, background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: 12, fontFamily: 'DM Mono, monospace', resize: 'vertical', outline: 'none', marginBottom: 10 }}
                />
              )}
              {!exampleFile && (
                <textarea
                  value={exampleFile}
                  onChange={e => setExampleFile(e.target.value)}
                  placeholder="Or paste your example README here…"
                  style={{ width: '100%', height: 80, padding: '8px 12px', borderRadius: 8, background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: 12, fontFamily: 'DM Mono, monospace', resize: 'vertical', outline: 'none', marginBottom: 10 }}
                />
              )}
              {exampleError && <p style={{ fontSize: 12, color: '#ef4444', marginBottom: 8 }}>{exampleError}</p>}
              <button
                onClick={handleSaveExampleAndGenerate}
                disabled={generatingWithExample || !exampleFile.trim()}
                style={{
                  padding: '8px 18px', borderRadius: 8, background: exampleFile.trim() ? '#60a5fa' : 'var(--surface-4)',
                  border: 'none', color: exampleFile.trim() ? '#fff' : 'var(--text-3)',
                  cursor: exampleFile.trim() ? 'pointer' : 'default', fontSize: 13, fontWeight: 600,
                }}
              >
                {generatingWithExample ? '⟳ Generating…' : '✨ Generate with example'}
              </button>
            </div>
          )}

          {/* GitHub commit panel */}
          {showCommit && readme && (
            <div style={{ padding: 16, borderRadius: 10, marginBottom: 16, background: 'rgba(163,230,53,0.04)', border: '1px solid rgba(163,230,53,0.15)' }}>
              <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 12px', fontFamily: 'Syne, sans-serif', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a3e635" strokeWidth="2">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77A5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
                Commit to GitHub
              </p>
              <input value={commitMsg} onChange={e => setCommitMsg(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text-1)', fontFamily: 'DM Mono, monospace', fontSize: 13, outline: 'none', marginBottom: 10 }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 12 }}>
                <div onClick={() => setCreatePR(v => !v)} style={{ width: 38, height: 20, borderRadius: 99, position: 'relative', background: createPR ? 'var(--lime)' : 'var(--surface-4)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }}>
                  <span style={{ position: 'absolute', top: 2, left: createPR ? 17 : 2, width: 14, height: 14, borderRadius: '50%', background: createPR ? '#0a0f02' : 'var(--text-3)', transition: 'left 0.2s' }} />
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Open Pull Request instead of direct commit</span>
              </label>
              {commitError && <p style={{ fontSize: 12, color: '#ef4444', marginBottom: 8 }}>⚠ {commitError}</p>}
              {commitResult && (
                <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(163,230,53,0.08)', border: '1px solid rgba(163,230,53,0.2)', marginBottom: 10 }}>
                  <p style={{ fontSize: 13, color: 'var(--lime)', fontWeight: 600, margin: commitResult.pr_url ? '0 0 4px' : 0 }}>✓ Success!</p>
                  {commitResult.pr_url && <a href={commitResult.pr_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: 'var(--lime)', textDecoration: 'none' }}>View Pull Request →</a>}
                  {!commitResult.pr_url && commitResult.note && <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0 }}>{commitResult.note}</p>}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowCommit(false)} style={{ padding: '7px 14px', borderRadius: 8, background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text-2)', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
                <button onClick={handleCommit} disabled={committing || !commitMsg.trim()} style={{ padding: '7px 18px', borderRadius: 8, background: 'var(--lime)', border: 'none', color: '#0a0f02', cursor: committing ? 'default' : 'pointer', fontSize: 13, fontWeight: 700, opacity: committing ? 0.7 : 1 }}>
                  {committing ? '⟳ Committing…' : createPR ? 'Open PR' : 'Commit README.md'}
                </button>
              </div>
            </div>
          )}

          {/* README content */}
          {!readme ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, color: 'var(--text-3)' }}>
              <p style={{ fontSize: 32, margin: 0 }}>📄</p>
              <p style={{ fontSize: 14, margin: 0 }}>No README generated yet</p>
              <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>Click "▷ Regenerate all" to generate one</p>
            </div>
          ) : viewMode === 'raw' ? (
            <div style={{ flex: 1, overflow: 'auto', padding: 24, borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <pre style={{ margin: 0, fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {readme}
              </pre>
            </div>
          ) : (
            <div className="scrollbar-thin" style={{ flex: 1, overflow: 'auto', padding: '32px 40px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <MarkdownRenderer content={readme} />
            </div>
          )}
        </div>
      )}
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
          <DocumentsPanel {...rest} selectedRepo={selectedRepo} user={rest.user} />
        )}
        {rightPanel === 'readme' && (
          <ReadmePanel {...rest} repoId={selectedRepo?.id} token={rest.token ?? ''} />
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