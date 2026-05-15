export const API = "http://localhost:8000/api/v1";

export const LANG_COLOR: Record<string, string> = {
  python: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  javascript: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  typescript: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  tsx: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
};

export const LANG_ICON: Record<string, string> = {
  python: "🐍",
  javascript: "🟨",
  typescript: "🔷",
  tsx: "🔷",
};

export const SYMBOL_ICON: Record<string, string> = {
  function: "ƒ",
  class: "◆",
  method: "∷",
  interface: "⬡",
  type: "τ",
};

export const SYMBOL_COLOR: Record<string, string> = {
  function: "text-violet-500",
  class: "text-blue-500",
  method: "text-emerald-500",
  interface: "text-orange-500",
  type: "text-pink-500",
};

export function formatDate(iso: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export function coverageColor(pct: number) {
  if (pct >= 75) return "text-emerald-600 dark:text-emerald-400";
  if (pct >= 40) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-500 dark:text-red-400";
}

export function coverageBarColor(pct: number) {
  if (pct >= 75) return "bg-gradient-to-r from-emerald-400 to-emerald-500";
  if (pct >= 40) return "bg-gradient-to-r from-yellow-400 to-yellow-500";
  return "bg-gradient-to-r from-red-400 to-red-500";
}