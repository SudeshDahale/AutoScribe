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
  const fileRef = useRef<HTMLInputElement>(null);

  // Load saved reference when panel opens
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
    setSavingRef(true);
    setRefError("");
    try {
      const res = await fetch(`${API}/prompt-editor/save-style-reference`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          repo_id: repoId,
          doc_type: "readme",
          reference_text: referenceText,
          label: referenceLabel || "Custom README style",
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setRefError(d.detail || "Failed to save");
      } else {
        setRefSaved(true);
        setTimeout(() => setRefSaved(false), 2500);
      }
    } catch {
      setRefError("Network error");
    }
    setSavingRef(false);
  };

  const handleDeleteReference = async () => {
    if (!repoId) return;
    await fetch(`${API}/prompt-editor/${repoId}/style-reference/readme`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setSavedReference(null);
    setReferenceText("");
    setReferenceLabel("");
  };

  const handleGenerateWithRef = () => {
    if (onRegenerate) onRegenerate(referenceText.trim() || undefined);
    setShowReferencePanel(false);
  };

  if (generating) return <Spinner label="Generating README with AI…" />;

  return (
    <div className="max-w-3xl animate-fade-in">
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Generated README</h2>
          <p className="text-xs text-gray-400 mt-0.5">AI-generated — review before committing</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleOpenPanel}
            className={`btn-ghost text-xs gap-1.5 ${savedReference ? "border-violet-400 text-violet-600 dark:text-violet-400" : ""}`}
            title="Set a style reference to control the output format"
          >
            {savedReference ? "✦ Style set" : "🎨 Style reference"}
          </button>
          {readme && (
            <button
              onClick={() => onCopy(readme)}
              className={`btn-ghost text-xs gap-1.5 ${copied ? "border-emerald-400 text-emerald-600 dark:text-emerald-400" : ""}`}
            >
              {copied ? "✓ Copied!" : "📋 Copy Markdown"}
            </button>
          )}
        </div>
      </div>

      {error && <ErrorMsg msg={error} />}

      {/* Style reference slide-in panel */}
      {showReferencePanel && (
        <div className="card p-5 mb-5 border-2 border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                🎨 Style Reference
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Paste any README (or upload a .md file) as a format template.
                AutoScribe will match its structure, headings, and tone — using your actual codebase for content.
              </p>
            </div>
            <button
              onClick={() => setShowReferencePanel(false)}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            >×</button>
          </div>

          {loadingRef ? (
            <Spinner label="Loading saved reference…" />
          ) : (
            <>
              {savedReference && (
                <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-violet-100 dark:bg-violet-900/40 rounded-lg text-xs text-violet-700 dark:text-violet-300">
                  <span>✦ Saved: <strong>{savedReference.label}</strong></span>
                  <span className="text-violet-400">·</span>
                  <span>{new Date(savedReference.saved_at).toLocaleDateString()}</span>
                  <button
                    onClick={handleDeleteReference}
                    className="ml-auto text-red-400 hover:text-red-600"
                  >Remove</button>
                </div>
              )}

              <input
                type="text"
                placeholder="Label (e.g. 'Stripe README style')"
                value={referenceLabel}
                onChange={e => setReferenceLabel(e.target.value)}
                className="input-field text-xs mb-2 w-full"
              />

              <textarea
                className="input-field text-xs font-mono w-full h-48 resize-y mb-2"
                placeholder="Paste a reference README here… or upload a file below."
                value={referenceText}
                onChange={e => setReferenceText(e.target.value)}
              />

              <div className="flex items-center gap-2 mb-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".md,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="btn-ghost text-xs"
                >📁 Upload .md file</button>
                <span className="text-xs text-gray-400">
                  {referenceText.length > 0 ? `${referenceText.length} chars` : ""}
                </span>
              </div>

              {refError && <p className="text-xs text-red-500 mb-2">{refError}</p>}

              <div className="flex gap-2">
                <button
                  onClick={handleSaveReference}
                  disabled={savingRef || !referenceText.trim()}
                  className="btn-primary text-xs"
                >
                  {savingRef ? "Saving…" : refSaved ? "✓ Saved!" : "💾 Save as default for this repo"}
                </button>
                {onRegenerate && (
                  <button
                    onClick={handleGenerateWithRef}
                    disabled={!referenceText.trim()}
                    className="btn-ghost text-xs border-violet-400 text-violet-600 dark:text-violet-400"
                  >
                    ✨ Generate now with this style
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Saved references are also applied automatically by the background scheduler.
              </p>
            </>
          )}
        </div>
      )}

      {!readme ? (
        <EmptyState
          icon="📄"
          title="No README yet"
          sub='Click "✨ README" on a repo to generate one with AI.'
        />
      ) : (
        <div className="card p-7 shadow-card">
          <MarkdownRenderer content={readme} />
        </div>
      )}
    </div>
  );
}