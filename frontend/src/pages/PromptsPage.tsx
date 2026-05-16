import { MarkdownRenderer } from '../components/ui/MarkdownRenderer';
import { Spinner } from '../components/ui/Spinner';
import { ErrorMsg } from '../components/ui/ErrorMsg';
import type { PromptTemplate, EditHistoryEntry, ValidationResult, Repo } from '../types';

interface Props {
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
  promptTab: 'editor' | 'preview' | 'history';
  validating: boolean;
  copied: boolean;
  onSelectTemplate: (tpl: PromptTemplate) => void;
  onPromptChange: (v: string) => void;
  onDocTypeChange: (v: string) => void;
  onValidate: () => void;
  onPreview: () => void;
  onGenerate: () => void;
  onTabChange: (t: 'editor' | 'preview' | 'history') => void;
  onCreatePRToggle: () => void;
  onRestorePrompt: (prompt: string) => void;
  onCopy: (text: string) => void;
}

export function PromptsPage({
  selectedRepo, promptTemplates, selectedTemplate,
  activePrompt, activeDocType, promptValidation, previewContent, previewing, previewError,
  generatingWithPrompt, promptGenError, promptGenSuccess, editHistory, loadingHistory,
  createPR, promptTab, validating, copied,
  onSelectTemplate, onPromptChange, onDocTypeChange,
  onValidate, onPreview, onGenerate, onTabChange, onCreatePRToggle, onRestorePrompt, onCopy,
}: Props) {

  const defaultTemplates: PromptTemplate[] = [
    {
      id: 1, name: 'Function docstring', doc_type: 'code_docs', category: 'code',
      prompt: "You are AutoScribe, an expert technical writer.\n\nWrite a concise docstring for the following {{language}} function.\nFocus on:\n- what it does (one sentence)\n- parameters and their constraints\n- return value and edge cases\n- any side effects\n\nUse the project's existing voice: {{voice}}.\n\nCode:\n{{code}}",
      description: 'Generate docstrings for functions', token_count: 412,
    },
    {
      id: 2, name: 'Module README', doc_type: 'readme', category: 'documentation',
      prompt: "Generate a README section for the module at {{path}}.\nInclude: purpose, public API surface, a minimal usage example,\nand a \"when to reach for this\" paragraph.\n\nKeep it under 250 words.\n\nSource:\n{{source}}",
      description: 'Create module-level READMEs', token_count: 980,
    },
    {
      id: 3, name: 'Drift summary', doc_type: 'architecture', category: 'engineering',
      prompt: "Compare OLD and NEW signatures and summarise what the caller needs to change. One paragraph. No marketing language.\n\nOLD:\n{{old}}\n\nNEW:\n{{new}}",
      description: 'Summarise API drift between versions', token_count: 220,
    },
  ];

  const templates = promptTemplates.length > 0 ? promptTemplates : defaultTemplates;

  // FIXED: consistent effective template handling
  const effectiveTemplate = selectedTemplate || templates[0];

  const activeTemplateName = effectiveTemplate?.name ?? '';

  const tokenCount = Math.round(activePrompt.length / 4);

  const variables = [...new Set(
    Array.from(
      activePrompt.matchAll(/\{\{(\w+)\}\}/g),
      m => m[1]
    )
  )];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 32px' }}>
      {/* Hero */}
      <div style={{ marginBottom: 36 }}>
        <p style={{
          fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--text-3)',
          letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8,
        }}>
          Prompts
        </p>
        <h1 style={{ fontSize: 48, fontFamily: 'Syne, sans-serif', fontWeight: 700, margin: '0 0 12px', lineHeight: 1.1 }}>
          Make the model{' '}
          <em style={{ color: 'var(--lime)', fontStyle: 'italic' }}>sound like your team.</em>
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-2)', margin: 0 }}>
          Prompts are versioned per project. Edit, preview against a real symbol from your
          codebase, and ship — no deploy required.
        </p>
      </div>

      {/* 3-column layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '240px minmax(0,1fr) 320px',
          gap: 16,
          alignItems: 'start',
        }}
      >

        {/* ── Column 1: Template sidebar ── */}
        <div style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          overflow: 'hidden',
        }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
            <p style={{
              fontSize: 10, fontFamily: 'DM Mono, monospace', color: 'var(--text-3)',
              textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0,
            }}>
              Prompt Set · Default
            </p>
          </div>

          <div className="scrollbar-thin" style={{ overflowY: 'auto', maxHeight: 520 }}>
            {templates.map(tpl => {
              const isActive = effectiveTemplate?.id === tpl.id;

              return (
                <button
                  key={tpl.id}
                  onClick={() => onSelectTemplate(tpl)}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: '14px 16px',
                    background: isActive ? 'var(--surface-3)' : 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--border)',
                    borderLeft: isActive ? '2px solid var(--lime)' : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) e.currentTarget.style.background = 'var(--surface-3)';
                  }}
                  onMouseLeave={e => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <p style={{
                    fontSize: 14, fontWeight: isActive ? 700 : 500,
                    fontFamily: 'Syne, sans-serif',
                    color: isActive ? 'var(--lime)' : 'var(--text-2)',
                    margin: '0 0 4px',
                  }}>
                    {tpl.name}
                  </p>

                  <p style={{
                    fontSize: 11,
                    fontFamily: 'DM Mono, monospace',
                    color: 'var(--text-3)',
                    margin: 0,
                  }}>
                    {tpl.token_count ?? tokenCount} tokens
                  </p>
                </button>
              );
            })}

            <button
              style={{
                width: '100%', textAlign: 'center',
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                color: 'var(--text-3)',
                fontFamily: 'DM Sans, sans-serif',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--lime)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--text-3)';
              }}
            >
              + new prompt
            </button>
          </div>
        </div>

        {/* ── Column 2: Editor ── */}
        <div style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Editor header */}
          <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <h3 style={{
              fontSize: 18,
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              margin: 0,
              color: 'var(--text-1)',
            }}>
              {activeTemplateName}
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 10px',
                borderRadius: 6,
                background: 'var(--surface-3)',
                border: '1px solid var(--border)',
                fontSize: 11,
                fontFamily: 'DM Mono, monospace',
                color: 'var(--text-3)',
              }}>
                ↺ v3
              </span>

              <button
                className="btn-primary"
                style={{ fontSize: 12, height: 30, padding: '0 14px' }}
                onClick={onPreview}
                disabled={!activePrompt.trim() || !selectedRepo || previewing}
              >
                ▷ Preview
              </button>
            </div>
          </div>

          {/* Textarea */}
          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              // FIXED: use ONLY activePrompt
              value={activePrompt}
              onChange={e => onPromptChange(e.target.value)}
              placeholder={
                "Write your prompt here…\n\nUse {{code}} to inject source code\nUse {{language}} for the language\nUse {{voice}} for team voice"
              }
              style={{
                width: '100%',
                height: 400,
                padding: '20px',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                fontFamily: 'DM Mono, monospace',
                fontSize: 13,
                lineHeight: 1.8,
                color: 'var(--text-1)',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Validation result */}
          {promptValidation && (
            <div style={{
              margin: '0 16px 12px',
              padding: '10px 14px',
              borderRadius: 8,
              background: promptValidation.valid
                ? 'rgba(163,230,53,0.06)'
                : 'rgba(239,68,68,0.06)',
              border: `1px solid ${
                promptValidation.valid
                  ? 'var(--lime-border)'
                  : 'rgba(239,68,68,0.25)'
              }`,
              fontSize: 12,
              color: promptValidation.valid ? 'var(--lime)' : '#ef4444',
            }}>
              {promptValidation.valid
                ? '✅ Prompt looks good'
                : '❌ Validation issues'}

              {Array.isArray(promptValidation.issues) &&
                promptValidation.issues.map((issue: string, i: number) => (
                  <div key={i} style={{ marginTop: 4, color: '#ef4444' }}>
                    ⚠ {issue}
                  </div>
                ))}
            </div>
          )}

          {promptGenSuccess && (
            <div style={{
              margin: '0 16px 12px',
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(163,230,53,0.06)',
              border: '1px solid var(--lime-border)',
              fontSize: 12,
              color: 'var(--lime)',
            }}>
              {promptGenSuccess}
            </div>
          )}

          {promptGenError && (
            <div style={{ margin: '0 16px 12px' }}>
              <ErrorMsg msg={promptGenError} />
            </div>
          )}

          {/* Footer */}
          <div style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{
              fontSize: 11,
              color: 'var(--text-3)',
              fontFamily: 'DM Mono, monospace',
            }}>
              {variables.map(v => (
                <code
                  key={v}
                  style={{
                    background: 'var(--surface-3)',
                    padding: '1px 5px',
                    borderRadius: 4,
                    border: '1px solid var(--border)',
                    marginRight: 4,
                    color: 'var(--lime)',
                  }}
                >
                  {`{{${v}}}`}
                </code>
              ))}

              <span style={{ marginLeft: 4 }}>
                {activePrompt.length} chars
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn-ghost"
                style={{ fontSize: 12, height: 30 }}
                onClick={onValidate}
                disabled={!activePrompt.trim() || validating}
              >
                {validating ? 'Checking…' : '🛡 Validate'}
              </button>

              <button
                className="btn-primary"
                style={{ fontSize: 12, height: 30 }}
                onClick={onGenerate}
                disabled={
                  !activePrompt.trim() ||
                  !selectedRepo ||
                  generatingWithPrompt
                }
              >
                {generatingWithPrompt
                  ? 'Generating…'
                  : createPR
                  ? '✨ Generate & PR'
                  : '✨ Generate & Save'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Column 3: Live Preview ── */}
        <div style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          overflow: 'hidden',
        }}>
          {/* Preview header */}
          <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>✦</span>

              <h3 style={{
                fontSize: 16,
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                margin: 0,
              }}>
                Live preview
              </h3>
            </div>

            {selectedRepo && (
              <span style={{
                fontSize: 10,
                fontFamily: 'DM Mono, monospace',
                color: 'var(--text-3)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}>
                Against {selectedRepo.full_name?.split('/')[1] ?? 'no repo'}
              </span>
            )}
          </div>

          <div style={{ padding: '20px' }}>
            {previewing ? (
              <Spinner label="Generating preview…" />
            ) : previewError ? (
              <ErrorMsg msg={previewError} />
            ) : previewContent ? (
              <>
                <div style={{ marginBottom: 20 }}>
                  <MarkdownRenderer content={previewContent} />
                </div>

                <button
                  onClick={() => onCopy(previewContent)}
                  className="btn-ghost"
                  style={{ fontSize: 11, height: 28 }}
                >
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
              </>
            ) : (
              <>
                <p style={{
                  fontSize: 14,
                  color: 'var(--text-2)',
                  lineHeight: 1.7,
                  marginBottom: 20,
                }}>
                  Click <strong style={{ color: 'var(--lime)' }}>Preview</strong> to see generated output against your repository.
                </p>

                {/* Stat mini-cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 8,
                  marginBottom: 16,
                }}>
                  {[
                    { label: 'tokens', value: String(tokenCount) },
                    { label: 'latency', value: '—' },
                    { label: 'cost', value: '$0.000' },
                  ].map(s => (
                    <div
                      key={s.label}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: 'var(--surface-3)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <p style={{
                        fontSize: 10,
                        fontFamily: 'DM Mono, monospace',
                        color: 'var(--text-3)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        margin: '0 0 4px',
                      }}>
                        {s.label}
                      </p>

                      <p style={{
                        fontSize: 18,
                        fontFamily: 'Syne, sans-serif',
                        fontWeight: 700,
                        color: s.label === 'cost'
                          ? 'var(--lime)'
                          : 'var(--text-1)',
                        margin: 0,
                      }}>
                        {s.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Grounding context */}
                <div style={{
                  padding: '12px 14px',
                  borderRadius: 8,
                  background: 'var(--surface-3)',
                  border: '1px solid var(--border)',
                  fontFamily: 'DM Mono, monospace',
                  fontSize: 12,
                }}>
                  <p style={{ color: 'var(--text-3)', margin: '0 0 8px' }}>
                    // grounding context
                  </p>

                  <p style={{ color: 'var(--text-2)', margin: '0 0 4px' }}>
                    + 12 surrounding symbols
                  </p>

                  <p style={{ color: 'var(--text-2)', margin: '0 0 4px' }}>
                    + 2 mentions in docs
                  </p>

                  <p style={{ color: 'var(--text-2)', margin: 0 }}>
                    + 1 prior version of this docstring
                  </p>
                </div>
              </>
            )}
          </div>

          {/* History section */}
          {editHistory.length > 0 && (
            <div style={{
              borderTop: '1px solid var(--border)',
              padding: '14px 20px',
            }}>
              <p style={{
                fontSize: 10,
                fontFamily: 'DM Mono, monospace',
                color: 'var(--text-3)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                margin: '0 0 10px',
              }}>
                Edit history
              </p>

              {loadingHistory ? (
                <Spinner label="Loading…" />
              ) : (
                editHistory.slice(0, 3).map((entry, i) => {
                  const formattedDate = entry.generated_at
                    ? new Date(entry.generated_at).toLocaleDateString()
                    : 'Unknown';

                  return (
                    <div
                      key={entry.generated_at ?? i}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 8,
                        background: 'var(--surface-3)',
                        border: '1px solid var(--border)',
                        marginBottom: 6,
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                      }}>
                        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                          {formattedDate}
                        </span>

                        <button
                          onClick={() => onRestorePrompt(entry.prompt)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 11,
                            color: 'var(--lime)',
                            fontWeight: 600,
                          }}
                        >
                          Restore
                        </button>
                      </div>

                      <p style={{
                        fontSize: 11,
                        fontFamily: 'DM Mono, monospace',
                        color: 'var(--text-2)',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {entry.prompt.slice(0, 60)}…
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}