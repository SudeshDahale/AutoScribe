export function LoginPage({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center mesh-bg dark:bg-[#0f0f14] relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm mx-4 animate-slide-up">
        {/* Card */}
        <div className="rounded-3xl border border-white/60 dark:border-white/[0.08] bg-white/80 dark:bg-[#17171f]/90 shadow-glow-lg backdrop-blur-xl p-10 text-center">

          {/* Logo mark */}
          <div className="relative mx-auto mb-6 w-20 h-20">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-glow blur-sm opacity-60" />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-glow">
              <span className="text-3xl">📝</span>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1 tracking-tight">AutoScribe</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
            AI-powered documentation for your<br />GitHub repositories
          </p>

          {/* Features list */}
          <div className="flex flex-col gap-2 mb-8 text-left">
            {[
              ["⚡", "Parse & index any GitHub repo"],
              ["✨", "Generate READMEs & docstrings with AI"],
              ["🔍", "Semantic search + RAG Q&A"],
              ["🤖", "Auto-update docs on every push"],
            ].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <span className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-base flex-shrink-0">{icon}</span>
                {text}
              </div>
            ))}
          </div>

          <button
            onClick={onLogin}
            className="w-full flex items-center justify-center gap-3 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3.5 text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-100 active:scale-[0.98] transition-all duration-150 shadow-lg"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current flex-shrink-0">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Continue with GitHub
          </button>

          <p className="text-xs text-gray-400 mt-5">Free · No credit card · Open source</p>
        </div>

        {/* Version pill */}
        <div className="flex justify-center mt-4">
          <span className="text-xs text-gray-400 bg-white/60 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full px-3 py-1">
            Beta — v0.1.0
          </span>
        </div>
      </div>
    </div>
  );
}