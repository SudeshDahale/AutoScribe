import type { User } from "../types";

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
    <header style={{
      height: 52,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px',
      borderBottom: '1px solid var(--border)',
      background: 'rgba(17,17,24,0.92)',
      backdropFilter: 'blur(12px)',
      position: 'sticky', top: 0, zIndex: 40,
      flexShrink: 0,
    }}>
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onToggleSidebar}
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          style={{
            width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)',
            background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-2)', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text-1)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)'; }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 4h12v1.5H2V4zm0 3.25h12v1.5H2v-1.5zM2 10.5h12V12H2v-1.5z" />
          </svg>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'var(--amber)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0a0a10" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-1)' }}>
            AutoScribe
          </span>
          <span className="pill-amber" style={{ marginLeft: 2 }}>beta</span>
        </div>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          className="btn-ghost"
          onClick={() => {
            if (!selectedRepo) { alert('Select a repository first'); return; }
            onOpenPromptEditor();
          }}
          style={{ display: window.innerWidth < 640 ? 'none' : 'inline-flex' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="m18.5 2.5 2 2L12 13H10v-2z"/>
          </svg>
          Prompt Editor
        </button>

        <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img
            src={user.avatar_url} alt="avatar"
            style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid var(--border-hover)' }}
          />
          <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500, display: window.innerWidth < 640 ? 'none' : 'block' }}>
            {user.username}
          </span>
        </div>

        <button
          className="btn-ghost"
          onClick={onLogout}
          style={{ color: 'var(--text-3)' }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}