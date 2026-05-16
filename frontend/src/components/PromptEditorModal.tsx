import { Badge } from "./ui/Badge";
import { Spinner } from "./ui/Spinner";
import { EmptyState } from "./ui/EmptyState";
import { ErrorMsg } from "./ui/ErrorMsg";
import { MarkdownRenderer } from "./ui/MarkdownRenderer";
import type { PromptTemplate, EditHistoryEntry, ValidationResult, Repo } from "../types";

interface Props {
  open: boolean;
  selectedRepo: Repo | null;
  promptTemplates: PromptTemplate[];
  selectedTemplate: PromptTemplate | null;
  activePrompt: string;
  activeDocType: string;
  promptValidation: ValidationResult | null;
  previewContent: string;
  previewing: boolean;
  previewError: string;
  generatingWithPrompt: boolean;
  promptGenError: string;
  promptGenSuccess: string;
  editHistory: EditHistoryEntry[];
  loadingHistory: boolean;
  createPR: boolean;
  promptTab: "editor" | "preview" | "history";
  validating: boolean;
  copied: boolean;
  onClose: () => void;
  onSelectTemplate: (tpl: PromptTemplate) => void;
  onPromptChange: (v: string) => void;
  onDocTypeChange: (v: string) => void;
  onValidate: () => void;
  onPreview: () => void;
  onGenerate: () => void;
  onTabChange: (t: "editor" | "preview" | "history") => void;
  onCreatePRToggle: () => void;
  onRestorePrompt: (prompt: string) => void;
  onCopy: (text: string) => void;
}

export function PromptEditorModal({
  open, selectedRepo, promptTemplates, selectedTemplate,
  activePrompt, activeDocType, promptValidation, previewContent, previewing, previewError,
  generatingWithPrompt, promptGenError, promptGenSuccess, editHistory, loadingHistory,
  createPR, promptTab, validating, copied,
  onClose, onSelectTemplate, onPromptChange, onDocTypeChange,
  onValidate, onPreview, onGenerate, onTabChange, onCreatePRToggle, onRestorePrompt, onCopy,
}: Props) {
  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 1100, maxHeight: '94vh', display: 'flex', flexDirection: 'column', borderRadius: 20, background: 'var(--surface-2)', border: '1px solid var(--border)', boxShadow: '0 32px 80px rgba(0,0,0,0.6)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: 'var(--text-1)', margin: 0 }}>Prompt Editor</h2>
            <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '3px 0 0' }}>Customize AI prompts to generate any documentation type</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {selectedRepo && (
              <span className="pill-lime">📂 {selectedRepo.full_name}</span>
            )}
            <button
              onClick={onClose}
              style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-3)', cursor: 'pointer', color: 'var(--text-2)', fontSize: 13 }}
            >
              ✕
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Template sidebar */}
          <div style={{ width: 240, flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--surface)', overflowY: 'auto' }} className="scrollbar-thin">
            <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border)' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Templates</p>
            </div>
            {["documentation", "engineering", "code"].map((cat) => {
              const items = promptTemplates.filter(t => t.category === cat);
              if (items.length === 0) return null;
              return (
                <div key={cat}>
                  <p style={{ padding: '12px 16px 4px', fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>{cat}</p>
                  {items.map(tpl => (
                    <button
                      key={tpl.id}
                      onClick={() => onSelectTemplate(tpl)}
                      style={{
                        width: '100%', textAlign: 'left', padding: '10px 16px',
                        background: selectedTemplate?.id === tpl.id ? 'var(--lime-dim)' : 'transparent',
                        border: 'none',
                        borderLeft: selectedTemplate?.id === tpl.id ? '2px solid var(--lime)' : '2px solid transparent',
                        cursor: 'pointer', transition: 'all 0.12s',
                        color: selectedTemplate?.id === tpl.id ? 'var(--lime)' : 'var(--text-2)',
                      }}
                    >
                      <p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 2px', color: 'inherit' }}>{tpl.name}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0, lineHeight: 1.4 }}>{tpl.description}</p>
                    </button>
                  ))}
                </div>
              );
            })}
            {promptTemplates.length === 0 && (
              <p className="px-4 py-6 text-xs text-gray-400 text-center">Loading templates…</p>
            )}
          </div>

          {/* Editor area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Sub-tabs */}
            <div className="flex gap-0.5 px-4 pt-3 border-b border-gray-100 dark:border-white/[0.06]">
              {(["editor", "preview", "history"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => onTabChange(t)}
                  className={`relative px-4 py-2.5 text-sm font-semibold capitalize transition-colors ${
                    promptTab === t ? "text-violet-600 dark:text-violet-400 tab-active-bar" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  {t === "editor" ? "✏️ Editor" : t === "preview" ? "👁 Preview" : "🕐 History"}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin p-5">

              {/* Editor tab */}
              {promptTab === "editor" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 w-24 flex-shrink-0">Doc Type</label>
                    <select
                      value={activeDocType}
                      onChange={e => onDocTypeChange(e.target.value)}
                      className="input-base flex-1"
                    >
                      <option value="readme">README</option>
                      <option value="architecture">Architecture Doc</option>
                      <option value="api_docs">API Documentation</option>
                      <option value="runbook">Runbook</option>
                      <option value="onboarding">Onboarding Guide</option>
                      <option value="code_docs">Code-Level Docs</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Prompt</label>
                      <span className="text-xs text-gray-400">{activePrompt.length} chars · ~{Math.round(activePrompt.length / 4)} tokens</span>
                    </div>
                    <textarea
                      value={activePrompt}
                      onChange={e => onPromptChange(e.target.value)}
                      rows={12}
                      placeholder={"Write your documentation prompt here…\n\nUse {context} to inject codebase structure\nUse {repo_name} for the repository name\nUse {symbols} for parsed symbols"}
                      className="input-base font-mono resize-none text-xs leading-relaxed"
                    />
                  </div>

                  {promptValidation && (
                    <div className={`rounded-2xl border p-4 ${promptValidation.valid ? "border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/10" : "border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/10"}`}>
                      <p className={`text-sm font-bold mb-2 ${promptValidation.valid ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
                        {promptValidation.valid ? "✅ Prompt looks good" : "❌ Validation issues"}
                      </p>
                      {promptValidation.issues.map((issue, i) => <p key={i} className="text-xs text-red-600 dark:text-red-400">⚠ {issue}</p>)}
                      {promptValidation.warnings.map((w, i) => <p key={i} className="text-xs text-yellow-600 dark:text-yellow-400">💡 {w}</p>)}
                    </div>
                  )}

                  {promptGenSuccess && (
                    <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/10 p-4 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      {promptGenSuccess}
                    </div>
                  )}
                  {promptGenError && <ErrorMsg msg={promptGenError} />}

                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <button
                      type="button"
                      onClick={onCreatePRToggle}
                      className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${createPR ? "bg-violet-600" : "bg-gray-300 dark:bg-gray-600"}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${createPR ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Create GitHub PR automatically after generating</span>
                  </label>
                </div>
              )}

              {/* Preview tab */}
              {promptTab === "preview" && (
                <div>
                  {previewing ? <Spinner label="Generating preview…" /> :
                   previewError ? <ErrorMsg msg={previewError} /> :
                   previewContent ? (
                    <div className="card p-6">
                      <div className="flex items-center justify-between mb-4">
                        <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold">Preview — not saved</Badge>
                        <button onClick={() => onCopy(previewContent)} className="btn-ghost text-xs">
                          {copied ? "✓ Copied!" : "📋 Copy"}
                        </button>
                      </div>
                      <MarkdownRenderer content={previewContent} />
                    </div>
                  ) : (
                    <EmptyState icon="👁" title="No preview yet" sub='Click "Preview" below to see generated output.' />
                  )}
                </div>
              )}

              {/* History tab */}
              {promptTab === "history" && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Edit History — {activeDocType}</h3>
                    <Badge className="bg-gray-100 dark:bg-white/[0.06] text-gray-500 font-bold">{editHistory.length} entries</Badge>
                  </div>
                  {loadingHistory ? <Spinner label="Loading history…" /> :
                   editHistory.length === 0 ? <EmptyState icon="🕐" title="No history yet" sub="Generate docs to start tracking edits." /> : (
                    <div className="space-y-3">
                      {editHistory.map((entry, i) => (
                        <div key={i} className="card p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-400">{new Date(entry.generated_at).toLocaleString()}</span>
                            <button onClick={() => onRestorePrompt(entry.prompt)} className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline">
                              Restore prompt
                            </button>
                          </div>
                          <p className="text-xs font-mono text-gray-500 dark:text-gray-400 line-clamp-2 mb-2 bg-gray-50 dark:bg-white/[0.04] rounded-lg p-2 border border-gray-100 dark:border-white/[0.06]">
                            {entry.prompt.slice(0, 200)}…
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3">{entry.content_preview}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-1.5 text-xs text-gray-400 hidden sm:flex">
                Variables:
                {["{context}", "{repo_name}", "{symbols}"].map(v => (
                  <code key={v} className="bg-gray-100 dark:bg-white/[0.06] px-1.5 py-0.5 rounded-lg font-mono border border-gray-200 dark:border-white/[0.08]">{v}</code>
                ))}
              </div>
              <div className="flex gap-2 ml-auto">
                <button onClick={onValidate} disabled={!activePrompt.trim() || validating} className="btn-ghost text-xs">
                  {validating ? "Checking…" : "🛡 Validate"}
                </button>
                <button onClick={onPreview} disabled={!activePrompt.trim() || !selectedRepo || previewing} className="btn-ghost text-xs">
                  {previewing ? "Previewing…" : "👁 Preview"}
                </button>
                <button
                  onClick={onGenerate}
                  disabled={!activePrompt.trim() || !selectedRepo || generatingWithPrompt || (promptValidation !== null && !promptValidation.valid)}
                  className="btn-primary text-xs px-5"
                >
                  {generatingWithPrompt ? "Generating…" : createPR ? "✨ Generate & PR" : "✨ Generate & Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}