export function EmptyState({ icon, title, sub }: { icon?: string; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center animate-fade-in">
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06] flex items-center justify-center text-3xl shadow-sm">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">{title}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs">{sub}</p>}
    </div>
  );
}