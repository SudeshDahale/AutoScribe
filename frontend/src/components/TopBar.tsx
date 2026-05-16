import type { User } from "../types";

type NavPage = "repositories" | "search" | "prompts";

interface Props {
  user: User;
  activePage: NavPage;
  onNavigate: (page: NavPage) => void;
  onLogout: () => void;
}

export function Topbar({ user, activePage, onNavigate, onLogout }: Props) {
  return (
    <header style={{
      height: 52,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px',
      borderBottom: '1px solid var(--border)',
      background: 'rgba(17,17,20,0.94)',
      backdropFilter: 'blur(12px)',
      position: 'sticky', top: 0, zIndex: 40,
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Wavy logo mark */}
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <rect width="26" height="26" rx="7" fill="var(--lime)" />
            <path d="M5 13 Q7 9 9 13 Q11 17 13 13 Q15 9 17 13 Q19 17 21 13"
              stroke="#0a0f02" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
          <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text-1)' }}>
            Auto<span style={{ color: 'var(--lime)', fontStyle: 'italic' }}>Scribe</span>
          </span>
        </div>

        {/* Nav links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {(['repositories', 'search', 'prompts'] as NavPage[]).map(page => {
            const label = page.charAt(0).toUpperCase() + page.slice(1);
            const isActive = activePage === page;
            return (
              <button
                key={page}
                onClick={() => onNavigate(page)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 8,
                  border: isActive ? '1px solid var(--border)' : '1px solid transparent',
                  background: isActive ? 'var(--surface-3)' : 'transparent',
                  color: isActive ? 'var(--text-1)' : 'var(--text-2)',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'var(--text-1)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'var(--text-2)'; }}
              >
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Scheduler live */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 6,
          border: '1px solid var(--border)',
          background: 'var(--surface-3)',
        }}>
          <span className="dot-lime" style={{ animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--text-2)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Scheduler Live
          </span>
        </div>

        {/* User */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
          <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif' }}>signed in as</span>
          <span style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 600, fontFamily: 'DM Mono, monospace' }}>@{user.username}</span>
        </div>
        <div
          onClick={onLogout}
          title="Sign out"
          style={{ cursor: 'pointer' }}
        >
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--lime)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13, color: '#0a0f02',
            overflow: 'hidden',
          }}>
            {user.avatar_url
              ? <img src={user.avatar_url} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : user.username[0].toUpperCase()
            }
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }`}</style>
    </header>
  );
}