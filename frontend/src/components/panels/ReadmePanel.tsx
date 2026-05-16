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
      const res = await fetch(`${API}/prompt-editor/create-pr`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 0 }}>
      {/* Toolbar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, padding: "0 0 16px",
        borderBottom: "1px solid var(--border)", marginBottom: 20, flexWrap: "wrap",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: 18, fontFamily: "Syne, sans-serif", fontWeight: 700, margin: "0 0 2px" }}>Generated README</h2>
          <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0, fontFamily: "DM Mono, monospace" }}>
            AI-generated · review before committing
          </p>
        </div>

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {/* View toggle */}
          {readme && (
            <div style={{
              display: "flex", borderRadius: 8, overflow: "hidden",
              border: "1px solid var(--border)", background: "var(--surface-3)",
            }}>
              {(["rendered", "raw"] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    padding: "6px 12px", background: viewMode === mode ? "var(--surface-4)" : "transparent",
                    border: "none", cursor: "pointer", fontSize: 12,
                    color: viewMode === mode ? "var(--text-1)" : "var(--text-3)",
                    fontFamily: "DM Mono, monospace", textTransform: "uppercase", letterSpacing: "0.05em",
                    transition: "all 0.15s",
                  }}
                >
                  {mode === "rendered" ? "⬡ Preview" : "{ } Raw"}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={handleOpenPanel}
            style={{
              padding: "6px 12px", borderRadius: 8,
              background: savedReference ? "rgba(163,230,53,0.08)" : "var(--surface-3)",
              border: `1px solid ${savedReference ? "rgba(163,230,53,0.3)" : "var(--border)"}`,
              color: savedReference ? "var(--lime)" : "var(--text-2)",
              cursor: "pointer", fontSize: 12, fontFamily: "DM Mono, monospace",
              display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s",
            }}
          >
            {savedReference ? "✦ Style set" : "🎨 Style"}
          </button>

          {readme && (
            <>
              <button
                onClick={() => onCopy(readme)}
                style={{
                  padding: "6px 12px", borderRadius: 8,
                  background: copied ? "rgba(163,230,53,0.08)" : "var(--surface-3)",
                  border: `1px solid ${copied ? "rgba(163,230,53,0.3)" : "var(--border)"}`,
                  color: copied ? "var(--lime)" : "var(--text-2)",
                  cursor: "pointer", fontSize: 12, fontFamily: "DM Mono, monospace",
                  display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s",
                }}
              >
                {copied ? "✓ Copied" : "📋 Copy"}
              </button>

              <button
                onClick={() => { setShowCommitPanel(v => !v); setCommitResult(null); setCommitError(""); }}
                style={{
                  padding: "6px 14px", borderRadius: 8,
                  background: showCommitPanel ? "var(--lime)" : "var(--surface-3)",
                  border: `1px solid ${showCommitPanel ? "var(--lime)" : "var(--border)"}`,
                  color: showCommitPanel ? "#0a0f02" : "var(--text-1)",
                  cursor: "pointer", fontSize: 12, fontFamily: "DM Mono, monospace",
                  display: "flex", alignItems: "center", gap: 6, fontWeight: 600,
                  transition: "all 0.15s",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77A5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
                Commit to GitHub
              </button>
            </>
          )}
        </div>
      </div>

      {error && <ErrorMsg msg={error} />}

      {/* GitHub commit panel */}
      {showCommitPanel && readme && (
        <div style={{
          padding: 20, borderRadius: 12, marginBottom: 20,
          background: "rgba(163,230,53,0.04)", border: "1px solid rgba(163,230,53,0.15)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a3e635" strokeWidth="2">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77A5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
            </svg>
            <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "Syne, sans-serif" }}>Commit to GitHub</span>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontFamily: "DM Mono, monospace", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
              Commit message
            </label>
            <input
              value={commitMsg}
              onChange={e => setCommitMsg(e.target.value)}
              style={{
                width: "100%", padding: "8px 12px", borderRadius: 8,
                background: "var(--surface-3)", border: "1px solid var(--border)",
                color: "var(--text-1)", fontFamily: "DM Mono, monospace", fontSize: 13,
                outline: "none",
              }}
            />
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 14 }}>
            <div
              onClick={() => setCreatePR(v => !v)}
              style={{
                width: 40, height: 22, borderRadius: 99, position: "relative",
                background: createPR ? "var(--lime)" : "var(--surface-4)",
                border: `1px solid ${createPR ? "var(--lime)" : "var(--border)"}`,
                cursor: "pointer", transition: "all 0.2s", flexShrink: 0,
              }}
            >
              <span style={{
                position: "absolute", top: 2, left: createPR ? 19 : 2, width: 16, height: 16,
                borderRadius: "50%", background: createPR ? "#0a0f02" : "var(--text-3)",
                transition: "left 0.2s",
              }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: "var(--text-1)" }}>Open Pull Request</p>
              <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0 }}>Creates a PR for review instead of direct commit</p>
            </div>
          </label>

          {commitError && (
            <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: 13, marginBottom: 12 }}>
              ⚠ {commitError}
            </div>
          )}

          {commitResult && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(163,230,53,0.08)", border: "1px solid rgba(163,230,53,0.25)", marginBottom: 12 }}>
              <p style={{ fontSize: 13, color: "var(--lime)", fontWeight: 600, margin: "0 0 4px" }}>✓ Success!</p>
              {commitResult.pr_url ? (
                <a href={commitResult.pr_url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 13, color: "var(--lime)", textDecoration: "none", borderBottom: "1px solid rgba(163,230,53,0.3)" }}>
                  View Pull Request →
                </a>
              ) : (
                <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0 }}>{commitResult.note || "Committed successfully."}</p>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setShowCommitPanel(false)}
              style={{
                padding: "8px 16px", borderRadius: 8, background: "var(--surface-3)",
                border: "1px solid var(--border)", color: "var(--text-2)", cursor: "pointer", fontSize: 13,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleCommit}
              disabled={committing || !commitMsg.trim()}
              style={{
                padding: "8px 20px", borderRadius: 8, background: "var(--lime)",
                border: "none", color: "#0a0f02", cursor: committing ? "default" : "pointer",
                fontSize: 13, fontWeight: 700, opacity: committing ? 0.7 : 1,
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              {committing ? (
                <>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid rgba(0,0,0,0.3)", borderTopColor: "#0a0f02", animation: "spin 0.6s linear infinite" }} />
                  Committing…
                </>
              ) : createPR ? "Open Pull Request" : "Commit README.md"}
            </button>
          </div>
        </div>
      )}

      {/* Style reference panel */}
      {showReferencePanel && (
        <div style={{
          padding: 20, borderRadius: 12, marginBottom: 20,
          background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.2)",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px", fontFamily: "Syne, sans-serif" }}>
                🎨 Style Reference
              </h3>
              <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0 }}>
                Paste a README or upload a .md file — AutoScribe will match its structure and tone.
              </p>
            </div>
            <button onClick={() => setShowReferencePanel(false)} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 4 }}>×</button>
          </div>

          {loadingRef ? <Spinner label="Loading saved reference…" /> : (
            <>
              {savedReference && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: "rgba(139,92,246,0.1)", marginBottom: 12, fontSize: 12, color: "#a78bfa" }}>
                  <span>✦ Saved: <strong>{savedReference.label}</strong></span>
                  <span style={{ marginLeft: "auto", cursor: "pointer", color: "#ef4444" }} onClick={handleDeleteReference}>Remove</span>
                </div>
              )}

              <input
                type="text" placeholder="Label (e.g. 'Stripe README style')"
                value={referenceLabel} onChange={e => setReferenceLabel(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: "var(--surface-3)", border: "1px solid var(--border)", color: "var(--text-1)", fontSize: 12, fontFamily: "DM Mono, monospace", marginBottom: 8, outline: "none" }}
              />

              <textarea
                placeholder="Paste a reference README here… or upload a file below."
                value={referenceText} onChange={e => setReferenceText(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, background: "var(--surface-3)", border: "1px solid var(--border)", color: "var(--text-1)", fontSize: 12, fontFamily: "DM Mono, monospace", height: 160, resize: "vertical", marginBottom: 10, outline: "none" }}
              />

              <input ref={fileRef} type="file" accept=".md,.txt" style={{ display: "none" }} onChange={handleFileUpload} />

              {refError && <p style={{ fontSize: 12, color: "#ef4444", marginBottom: 8 }}>{refError}</p>}

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => fileRef.current?.click()} style={{ padding: "6px 12px", borderRadius: 8, background: "var(--surface-3)", border: "1px solid var(--border)", color: "var(--text-2)", cursor: "pointer", fontSize: 12 }}>
                  📁 Upload .md
                </button>
                <button onClick={handleSaveReference} disabled={savingRef || !referenceText.trim()} style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa", cursor: "pointer", fontSize: 12 }}>
                  {savingRef ? "Saving…" : refSaved ? "✓ Saved!" : "💾 Save default"}
                </button>
                {onRegenerate && (
                  <button onClick={handleGenerateWithRef} disabled={!referenceText.trim()} style={{ padding: "6px 12px", borderRadius: 8, background: "var(--surface-3)", border: "1px solid rgba(139,92,246,0.4)", color: "#a78bfa", cursor: "pointer", fontSize: 12 }}>
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
        <div style={{
          flex: 1, padding: 24, borderRadius: 12,
          background: "var(--surface-2)", border: "1px solid var(--border)",
          overflow: "auto",
        }}>
          <pre style={{ margin: 0, fontFamily: "DM Mono, monospace", fontSize: 12, color: "var(--text-2)", lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {readme}
          </pre>
        </div>
      ) : (
        <div style={{
          flex: 1, padding: "32px 40px", borderRadius: 12,
          background: "var(--surface-2)", border: "1px solid var(--border)",
          overflow: "auto", minHeight: 0,
        }}>
          <MarkdownRenderer content={readme} />
        </div>
      )}
    </div>
  );
}
