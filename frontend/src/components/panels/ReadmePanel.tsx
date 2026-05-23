import { useState, useRef } from "react";
import { Spinner } from "../ui/Spinner";
import { EmptyState } from "../ui/EmptyState";
import { ErrorMsg } from "../ui/ErrorMsg";
import { MarkdownRenderer } from "../ui/MarkdownRenderer";
import { API } from "../../constants";

interface StyleReference {
  label: string;
  reference_text: string;
  saved_at: string;
}

interface Props {
  generating: boolean;
  error: string;
  readme: string;
  copied: boolean;
  onCopy: (text: string) => void;
  repoId: number | null;
  token: string;
  onRegenerate?: (referenceText?: string) => void;
}

export function ReadmePanel({
  generating, error, readme, copied, onCopy,
  repoId, token, onRegenerate,
}: Props) {
  const [showReferencePanel, setShowReferencePanel] = useState(false);
  const [referenceText, setReferenceText] = useState("");
  const [referenceLabel, setReferenceLabel] = useState("");
  const [savedReference, setSavedReference] = useState<StyleReference | null>(null);
  const [savingRef, setSavingRef] = useState(false);
  const [refSaved, setRefSaved] = useState(false);
  const [refError, setRefError] = useState("");
  const [loadingRef, setLoadingRef] = useState(false);

  // GitHub commit state
  const [showCommitPanel, setShowCommitPanel] = useState(false);
  const [commitMsg, setCommitMsg] = useState("docs: update README via AutoScribe");
  const [createPR, setCreatePR] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState<{ pr_url?: string; note?: string } | null>(null);
  const [commitError, setCommitError] = useState("");

  // View mode: rendered or raw
  const [viewMode, setViewMode] = useState<"rendered" | "raw">("rendered");

  const fileRef = useRef<HTMLInputElement>(null);

  const handleOpenPanel = async () => {
    setShowReferencePanel(true);
    if (!repoId) return;
    setLoadingRef(true);
    try {
      const res = await fetch(`${API}/prompt-editor/${repoId}/style-reference/readme`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.reference) {
        setSavedReference(data.reference);
        setReferenceText(data.reference.reference_text);
        setReferenceLabel(data.reference.label);
      }
    } catch { /* ignore */ }
    setLoadingRef(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setReferenceText(ev.target?.result as string ?? "");
    reader.readAsText(file);
    if (!referenceLabel) setReferenceLabel(file.name.replace(/\.[^.]+$/, "") + " style");
  };

  const handleSaveReference = async () => {
    if (!repoId || !referenceText.trim()) return;
    setSavingRef(true); setRefError("");
    try {
      const res = await fetch(`${API}/prompt-editor/save-style-reference`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ repo_id: repoId, doc_type: "readme", reference_text: referenceText, label: referenceLabel || "Custom README style" }),
      });
      if (!res.ok) { const d = await res.json(); setRefError(d.detail || "Failed to save"); }
      else { setRefSaved(true); setTimeout(() => setRefSaved(false), 2500); }
    } catch { setRefError("Network error"); }
    setSavingRef(false);
  };

  const handleDeleteReference = async () => {
    if (!repoId) return;
    await fetch(`${API}/prompt-editor/${repoId}/style-reference/readme`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    setSavedReference(null); setReferenceText(""); setReferenceLabel("");
  };

  const handleGenerateWithRef = () => {
    if (onRegenerate) onRegenerate(referenceText.trim() || undefined);
    setShowReferencePanel(false);
  };

    const handleCommit = async () => {
      if (!repoId || !readme) return;
      setCommitting(true); setCommitError(""); setCommitResult(null);
      try {
        const res = await fetch(`${API}/prompt-editor/${repoId}/create-pr`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      repo_id: repoId,
      doc_type: "readme",
      content: readme,
      commit_message: commitMsg,
      create_pr: createPR,
    }),
  });
      if (!res.ok) {
        const d = await res.json();
        setCommitError(d.detail || "Failed to commit.");
      } else {
        const data = await res.json();
        setCommitResult(data);
      }
    } catch { setCommitError("Network error during commit."); }
    setCommitting(false);
  };

  if (generating) return <Spinner label="Generating README with AI…" />;

  return (
    <div className="flex flex-col h-full gap-0">
      {/* Toolbar */}
      <div className="panel-toolbar">
        <div className="panel-header">
          <h2 className="panel-title">Generated README</h2>
          <p className="panel-subtitle">
            AI-generated · review before committing
          </p>
        </div>

        <div className="flex gap-1.5 items-center">
          {/* View toggle */}
          {readme && (
            <div className="view-toggle">
              {(["rendered", "raw"] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={viewMode === mode ? "view-toggle-btn-active" : "view-toggle-btn"}
                >
                  {mode === "rendered" ? "⬡ Preview" : "{ } Raw"}
                </button>
              ))}
            </div>
          )}

          <button onClick={handleOpenPanel} className="btn-ghost">
            🎨 Style
          </button>

          {readme && (
            <>
              <button onClick={() => onCopy(readme)} className="btn-ghost">
                {copied ? "✓ Copied" : "📋 Copy"}
              </button>
              <button onClick={() => setShowCommitPanel(true)} className="btn-primary">
                💾 Commit
              </button>
            </>
          )}
        </div>
      </div>

      {error && <ErrorMsg msg={error} />}

      {/* Commit panel */}
      {showCommitPanel && (
        <div className="commit-panel">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold mb-1 font-[Syne]">
                💾 Commit to GitHub
              </h3>
              <p className="text-xs text-[var(--text-3)] m-0">
                Push this README directly or open a pull request for review.
              </p>
            </div>
            <button onClick={() => setShowCommitPanel(false)} className="btn-close">
              ×
            </button>
          </div>

          <div className="mb-3">
            <label className="form-label">Commit message</label>
            <input
              value={commitMsg}
              onChange={e => setCommitMsg(e.target.value)}
              className="form-input"
            />
          </div>

          <label className="toggle-container mb-3.5">
            <div
              onClick={() => setCreatePR(v => !v)}
              className={`toggle-switch ${createPR ? 'toggle-switch-on' : 'toggle-switch-off'}`}
            >
              <span className={`toggle-knob ${createPR ? 'toggle-knob-on' : 'toggle-knob-off'}`} />
            </div>
            <div>
              <p className="toggle-label-primary">Open Pull Request</p>
              <p className="toggle-label-secondary">Creates a PR for review instead of direct commit</p>
            </div>
          </label>

          {commitError && (
            <div className="alert-error mb-3">
              ⚠ {commitError}
            </div>
          )}

          {commitResult && (
            <div className="alert-success mb-3">
              <p className="alert-success-title">✓ Success!</p>
              {commitResult.pr_url ? (
                <a 
                  href={commitResult.pr_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="alert-success-link"
                >
                  View Pull Request →
                </a>
              ) : (
                <p className="alert-success-text">{commitResult.note || "Committed successfully."}</p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => setShowCommitPanel(false)} className="btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleCommit}
              disabled={committing || !commitMsg.trim()}
              className="btn-primary"
              style={{ opacity: committing ? 0.7 : 1 }}
            >
              {committing ? (
                <>
                  <div className="spinner-inline" />
                  Committing…
                </>
              ) : createPR ? "Open Pull Request" : "Commit README.md"}
            </button>
          </div>
        </div>
      )}

      {/* Style reference panel */}
      {showReferencePanel && (
        <div className="reference-panel">
          <div className="reference-panel-header">
            <div>
              <h3 className="reference-panel-title">
                🎨 Style Reference
              </h3>
              <p className="text-xs text-[var(--text-3)] m-0">
                Paste a README or upload a .md file — AutoScribe will match its structure and tone.
              </p>
            </div>
            <button onClick={() => setShowReferencePanel(false)} className="btn-close">
              ×
            </button>
          </div>

          {loadingRef ? <Spinner label="Loading saved reference…" /> : (
            <>
              {savedReference && (
                <div className="saved-reference-badge mb-3">
                  <span>✦ Saved: <strong>{savedReference.label}</strong></span>
                  <span className="btn-delete" onClick={handleDeleteReference}>Remove</span>
                </div>
              )}

              <input
                type="text" 
                placeholder="Label (e.g. 'Stripe README style')"
                value={referenceLabel} 
                onChange={e => setReferenceLabel(e.target.value)}
                className="form-input mb-2"
              />

              <textarea
                placeholder="Paste a reference README here… or upload a file below."
                value={referenceText} 
                onChange={e => setReferenceText(e.target.value)}
                className="form-textarea h-40 mb-2.5"
              />

              <input 
                ref={fileRef} 
                type="file" 
                accept=".md,.txt" 
                className="hidden" 
                onChange={handleFileUpload} 
              />

              {refError && <p className="text-xs text-[var(--red)] mb-2">{refError}</p>}

              <div className="flex gap-2">
                <button onClick={() => fileRef.current?.click()} className="btn-small">
                  📁 Upload .md
                </button>
                <button 
                  onClick={handleSaveReference} 
                  disabled={savingRef || !referenceText.trim()} 
                  className="btn-purple"
                >
                  {savingRef ? "Saving…" : refSaved ? "✓ Saved!" : "💾 Save default"}
                </button>
                {onRegenerate && (
                  <button 
                    onClick={handleGenerateWithRef} 
                    disabled={!referenceText.trim()} 
                    className="btn-purple-outline"
                  >
                    ✨ Generate with style
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Content area */}
      {!readme ? (
        <EmptyState icon="📄" title="No README yet" sub='Click "✨ README" on a repo card to generate one with AI.' />
      ) : viewMode === "raw" ? (
        <div className="content-card scrollbar-thin">
          <pre className="code-block">
            {readme}
          </pre>
        </div>
      ) : (
        <div className="content-card-padded scrollbar-thin">
          <MarkdownRenderer content={readme} />
        </div>
      )}
    </div>
  );
}