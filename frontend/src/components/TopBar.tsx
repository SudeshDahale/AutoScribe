import type { User } from "../types";
import { Badge } from "./ui/Badge";

interface Props {
  user: User;
  sidebarOpen: boolean;
  selectedRepo: { full_name: string } | null;
  onToggleSidebar: () => void;
  onOpenPromptEditor: () => void;
  onLogout: () => void;
}

export function Topbar({ user, sidebarOpen, selectedRepo, onToggleSidebar, onOpenPromptEditor, onLogout }: Props) {
  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-gray-100 dark:border-white/[0.06] bg-white/80 dark:bg-[#17171f]/80 backdrop-blur-lg sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-500 transition-colors"
          title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current">
            {sidebarOpen
              ? <path d="M2 4h12v1.5H2V4zm0 3.25h12v1.5H2v-1.5zM2 10.5h12V12H2v-1.5z" />
              : <path d="M2 4h12v1.5H2V4zm0 3.25h12v1.5H2v-1.5zM2 10.5h12V12H2v-1.5z" />}
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm shadow-sm">
            📝
          </div>
          <span className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight">AutoScribe</span>
          <Badge className="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-[10px] font-bold tracking-wide">BETA</Badge>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            if (!selectedRepo) { alert("Select a repository first"); return; }
            onOpenPromptEditor();
          }}
          className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-violet-200 dark:border-violet-800/60 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
        >
          ✏️ Prompt Editor
        </button>

        <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-1 hidden sm:block" />

        <div className="flex items-center gap-2.5">
          <img src={user.avatar_url} alt="avatar" className="w-8 h-8 rounded-full border-2 border-violet-200 dark:border-violet-800/60 shadow-sm" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 hidden sm:block">{user.username}</span>
        </div>

        <button
          onClick={onLogout}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2.5 py-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 font-medium"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}