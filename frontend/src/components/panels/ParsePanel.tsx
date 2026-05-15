import { LANG_ICON, SYMBOL_COLOR, SYMBOL_ICON } from "../../constants";
import { Badge } from "../ui/Badge";
import { Spinner } from "../ui/Spinner";
import { EmptyState } from "../ui/EmptyState";
import { ErrorMsg } from "../ui/ErrorMsg";
import type { ParsedFile } from "../../types";

interface Props {
  parsing: boolean;
  parseError: string;
  parseResults: ParsedFile[];
  expandedFiles: Set<string>;
  onToggleFile: (path: string) => void;
  onGenerateDocstrings: (file: ParsedFile) => void;
  repoName?: string;
}

export function ParsePanel({ parsing, parseError, parseResults, expandedFiles, onToggleFile, onGenerateDocstrings, repoName }: Props) {
  const totalSymbols = parseResults.reduce((a, f) => a + f.symbols.length, 0);

  if (parsing) return <Spinner label={`Parsing ${repoName}…`} />;
  if (parseError) return <ErrorMsg msg={parseError} />;
  if (parseResults.length === 0) return <EmptyState icon="⚙" title="Not parsed yet" sub='Click "⚙ Parse" on a repo to analyse its code structure.' />;

  return (
    <div className="max-w-3xl space-y-2 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Code Structure</h2>
          <p className="text-xs text-gray-400 mt-0.5">Parsed symbols from your repository</p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold">{parseResults.length} files</Badge>
          <Badge className="bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-bold">{totalSymbols} symbols</Badge>
        </div>
      </div>

      {parseResults.map((file) => (
        <div key={file.file_path} className="card overflow-hidden transition-shadow hover:shadow-card-hover">
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50/80 dark:bg-white/[0.03]">
            <button className="flex items-center gap-2.5 flex-1 text-left min-w-0" onClick={() => onToggleFile(file.file_path)}>
              <span className="text-lg flex-shrink-0">{LANG_ICON[file.language] ?? "📄"}</span>
              <span className="text-sm font-mono font-semibold text-gray-700 dark:text-gray-300 truncate">{file.file_path}</span>
              <Badge className="bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400 ml-auto flex-shrink-0 font-bold">{file.symbols.length}</Badge>
              <span className="text-gray-400 flex-shrink-0 text-xs ml-1">{expandedFiles.has(file.file_path) ? "▾" : "▸"}</span>
            </button>
            <button
              onClick={() => onGenerateDocstrings(file)}
              className="btn-ghost text-[11px] px-2.5 py-1.5 flex-shrink-0"
            >
              ✨ Docstrings
            </button>
          </div>

          {expandedFiles.has(file.file_path) && (
            <div className="divide-y divide-gray-50 dark:divide-white/[0.04]">
              {file.symbols.map((sym, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <span className={`font-mono text-sm font-bold flex-shrink-0 mt-0.5 ${SYMBOL_COLOR[sym.type] ?? "text-gray-400"}`}>
                    {SYMBOL_ICON[sym.type] ?? "·"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 font-mono">{sym.name}</span>
                      <Badge className="bg-gray-100 dark:bg-white/[0.06] text-gray-400 text-[10px]">{sym.type}</Badge>
                      <span className="text-[11px] text-gray-400 font-mono">:{sym.line}</span>
                    </div>
                    {sym.docstring && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{sym.docstring}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}