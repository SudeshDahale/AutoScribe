export function ErrorMsg({ msg }: { msg: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-200/80 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 px-4 py-3 text-sm text-red-700 dark:text-red-400 animate-slide-up">
      <span className="text-base flex-shrink-0 mt-0.5">⚠</span>
      <span>{msg}</span>
    </div>
  );
}