import { Badge } from "../ui/Badge";
import { Spinner } from "../ui/Spinner";
import { EmptyState } from "../ui/EmptyState";
import { ErrorMsg } from "../ui/ErrorMsg";
import type { StalenessReport } from "../../types";

interface Props {
  checking: boolean;
  error: string;
  report: StalenessReport | null;
  updating: boolean;
  repoName?: string;
  onUpdate: (type: "docstrings" | "readme" | "all") => void;
}

export function StalenessPanel({ checking, error, report, updating, repoName, onUpdate }: Props) {
  if (checking) return <Spinner label="Checking documentation health…" />;
  if (error) return <ErrorMsg msg={error} />;
  if (!report) return <EmptyState icon="🩺" title='Click "🩺 Health" on a repo' />;

  const isStale = report.status !== "up_to_date";

  return (
    <div className="max-w-2xl space-y-4 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Documentation Health</h2>
          {repoName && <p className="text-xs text-gray-400 mt-0.5">{repoName}</p>}
        </div>
      </div>

      {/* Status card */}
      <div className={`card p-6 ${isStale ? "border-yellow-200 dark:border-yellow-800/50 bg-yellow-50 dark:bg-yellow-900/10" : "border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/10"}`}>
        <div className="flex items-center gap-4 mb-4">
          <span className="text-4xl">{isStale ? "⚠️" : "✅"}</span>
          <div>
            <p className={`text-base font-bold ${isStale ? "text-yellow-800 dark:text-yellow-300" : "text-emerald-800 dark:text-emerald-300"}`}>
              {isStale ? "Documentation is stale" : "Documentation is up to date"}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">{report.stale_files_count} file(s) need attention</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {(["new", "modified", "deleted"] as const).map((k) => (
            <div key={k} className="rounded-xl bg-white dark:bg-[#17171f] border border-gray-100 dark:border-white/[0.06] p-3 text-center shadow-sm">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{report.breakdown[k] ?? 0}</p>
              <p className="text-xs font-medium text-gray-400 capitalize mt-0.5">{k}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stale files */}
      {report.stale_files.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 bg-gray-50/80 dark:bg-white/[0.03] flex items-center justify-between border-b border-gray-100 dark:border-white/[0.06]">
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Stale Files</p>
            <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 font-bold">{report.stale_files.length}</Badge>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-white/[0.04]">
            {report.stale_files.map((f, i) => (
              <div key={i} className="px-4 py-3 flex items-start gap-3">
                <span className={`text-sm mt-0.5 flex-shrink-0 ${f.status === "new" ? "text-blue-500" : f.status === "deleted" ? "text-red-500" : "text-yellow-500"}`}>●</span>
                <div className="min-w-0 flex-1">
                  <code className="text-xs font-mono text-gray-700 dark:text-gray-300">{f.file_path}</code>
                  <p className="text-xs text-gray-400 mt-0.5">{f.reason}</p>
                </div>
                <Badge className={`ml-auto text-[10px] flex-shrink-0 font-bold ${f.status === "new" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : f.status === "deleted" ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"}`}>
                  {f.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Update buttons */}
      {report.stale_files_count > 0 && (
        <div className="flex flex-wrap gap-2">
          {(["docstrings", "readme", "all"] as const).map((type) => (
            <button
              key={type}
              onClick={() => onUpdate(type)}
              disabled={updating}
              className="btn-ghost text-sm"
            >
              {updating ? "Updating…" : `↺ Update ${type}`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}