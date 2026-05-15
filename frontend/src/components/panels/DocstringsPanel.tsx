import { SYMBOL_COLOR, SYMBOL_ICON } from "../../constants";
import { Badge } from "../ui/Badge";
import { Spinner } from "../ui/Spinner";
import { EmptyState } from "../ui/EmptyState";
import { ErrorMsg } from "../ui/ErrorMsg";
import type { Docstring } from "../../types";

interface Props {
  generating: boolean;
  error: string;
  docstrings: Docstring[];
  filePath: string;
  onCopy: (text: string) => void;
}

export function DocstringsPanel({ generating, error, docstrings, filePath, onCopy }: Props) {
  if (generating) return <Spinner label="Generating docstrings with AI…" />;
  if (error) return <ErrorMsg msg={error} />;
  if (docstrings.length === 0) return <EmptyState icon="💬" title="No docstrings generated yet" />;

  return (
    <div className="max-w-3xl animate-fade-in">
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Docstrings</h2>
        <code className="text-xs bg-gray-100 dark:bg-white/[0.06] px-2.5 py-1 rounded-lg text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/[0.08]">
          {filePath}
        </code>
      </div>

      <div className="space-y-3">
        {docstrings.map((d, i) => (
          <div key={i} className="card p-5 hover:shadow-card-hover transition-shadow">
            <div className="flex items-center gap-2.5 mb-3">
              <span className={`font-mono text-base font-bold ${SYMBOL_COLOR[d.type] ?? "text-gray-400"}`}>
                {SYMBOL_ICON[d.type] ?? "·"}
              </span>
              <span className="text-sm font-bold font-mono text-gray-800 dark:text-gray-200">{d.name}</span>
              <Badge className="bg-gray-100 dark:bg-white/[0.06] text-gray-400">{d.type}</Badge>
              <button onClick={() => onCopy(d.docstring)} className="ml-auto btn-ghost text-xs py-1">
                📋 Copy
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-white/[0.03] rounded-xl px-4 py-3 border border-gray-100 dark:border-white/[0.05]">
              {d.docstring}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}