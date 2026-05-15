export function StatCard({
  icon, label, value, sub, trend,
}: {
  icon: string; label: string; value: string | number; sub?: string; trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="card p-5 flex items-start gap-4 hover:shadow-card-hover transition-shadow duration-200">
      <div className="w-11 h-11 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-900/40 flex items-center justify-center text-xl flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>}
      </div>
      {trend && (
        <span className={`text-xs font-bold mt-1 ${trend === "up" ? "text-emerald-500" : trend === "down" ? "text-red-400" : "text-gray-400"}`}>
          {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
        </span>
      )}
    </div>
  );
}