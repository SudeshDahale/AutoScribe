import { Spinner } from "../ui/Spinner";
import { EmptyState } from "../ui/EmptyState";
import { ErrorMsg } from "../ui/ErrorMsg";
import { MarkdownRenderer } from "../ui/MarkdownRenderer";

interface Props {
  generating: boolean;
  error: string;
  readme: string;
  copied: boolean;
  onCopy: (text: string) => void;
}

export function ReadmePanel({ generating, error, readme, copied, onCopy }: Props) {
  if (generating) return <Spinner label="Generating README with AI…" />;
  if (error) return <ErrorMsg msg={error} />;
  if (!readme) return <EmptyState icon="📄" title="No README yet" sub='Click "✨ README" on a repo to generate one with AI.' />;

  return (
    <div className="max-w-3xl animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Generated README</h2>
          <p className="text-xs text-gray-400 mt-0.5">AI-generated — review before committing</p>
        </div>
        <button
          onClick={() => onCopy(readme)}
          className={`btn-ghost text-xs gap-1.5 ${copied ? "border-emerald-400 text-emerald-600 dark:text-emerald-400" : ""}`}
        >
          {copied ? "✓ Copied!" : "📋 Copy Markdown"}
        </button>
      </div>

      <div className="card p-7 shadow-card">
        <MarkdownRenderer content={readme} />
      </div>
    </div>
  );
}