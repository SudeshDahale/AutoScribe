import type { RightPanel, Repo } from "../types";

const TABS: { id: RightPanel; label: string; icon: string }[] = [
  { id: "parse",      label: "Structure",  icon: "⚙" },
  { id: "readme",     label: "README",     icon: "📄" },
  { id: "docstrings", label: "Docstrings", icon: "💬" },
  { id: "search",     label: "Search",     icon: "🔍" },
  { id: "analytics",  label: "Analytics",  icon: "📊" },
  { id: "staleness",  label: "Health",     icon: "🩺" },
  { id: "webhook",    label: "PR Bot",     icon: "🤖" },
];

interface Props {
  selectedRepo: Repo;
  rightPanel: RightPanel;
  hasDocstrings: boolean;
  onSelect: (id: RightPanel) => void;
}

export function TabBar({ selectedRepo, rightPanel, hasDocstrings, onSelect }: Props) {
  const tabs = TABS.filter(t => t.id !== "docstrings" || hasDocstrings);
  return (
    <div className="flex items-center gap-0.5 px-4 pt-2 border-b border-gray-100 dark:border-white/[0.06] bg-white/50 dark:bg-[#17171f]/50 overflow-x-auto scrollbar-thin">
      <span className="text-xs text-gray-400 mr-3 flex-shrink-0 hidden lg:flex items-center gap-1.5 font-medium">
        <span className="text-gray-300 dark:text-gray-600">📂</span>
        {selectedRepo.full_name}
      </span>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          className={`relative px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-colors duration-150 ${
            rightPanel === tab.id
              ? "text-violet-600 dark:text-violet-400 tab-active-bar"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <span className="mr-1.5">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
}