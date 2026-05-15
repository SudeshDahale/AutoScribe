export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 animate-fade-in">
      <div className="relative">
        <div className="spinner" />
        <div className="absolute inset-0 rounded-full bg-violet-500/10 blur-xl" />
      </div>
      {label && <p className="text-sm text-gray-400 font-medium">{label}</p>}
    </div>
  );
}