export function LoginPage({ onLogin }: { onLogin: () => void }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--surface)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Grid background */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(245,158,11,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(245,158,11,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
      }} />
      {/* Glow */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600, height: 400,
        background: 'radial-gradient(ellipse at center, rgba(245,158,11,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="fade-up" style={{ position: 'relative', width: '100%', maxWidth: 420, padding: '0 24px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'var(--amber)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0a0a10" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-1)', lineHeight: 1 }}>
              AutoScribe
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500 }}>
              Documentation Engine
            </div>
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '32px 28px',
        }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 26, fontWeight: 700,
              letterSpacing: '-0.03em',
              color: 'var(--text-1)',
              margin: '0 0 10px',
            }}>
              Ship better docs, faster
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>
              Connect your GitHub and let AutoScribe handle READMEs, docstrings, and semantic search — automatically.
            </p>
          </div>

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
            {[
              { icon: '⚡', label: 'Parse & index any GitHub repo' },
              { icon: '✦', label: 'AI-generated READMEs & docstrings' },
              { icon: '⌖', label: 'Semantic search + RAG Q&A' },
              { icon: '↻', label: 'Auto-update docs on every push' },
            ].map(({ icon, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: 'var(--surface-4)',
                  border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, flexShrink: 0, color: 'var(--amber)',
                  fontFamily: 'DM Mono, monospace',
                }}>
                  {icon}
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--border)', marginBottom: 24 }} />

          {/* CTA */}
          <button onClick={onLogin} style={{
            width: '100%', height: 44,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            borderRadius: 10,
            background: 'var(--text-1)', color: 'var(--surface)',
            fontFamily: 'Syne, sans-serif',
            fontSize: 14, fontWeight: 700,
            border: 'none', cursor: 'pointer',
            transition: 'opacity 0.15s',
            letterSpacing: '-0.01em',
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" style={{ fill: 'currentColor', flexShrink: 0 }}>
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Continue with GitHub
          </button>

          <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', marginTop: 16, marginBottom: 0 }}>
            Free · Open source · No credit card
          </p>
        </div>

        {/* Version */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
          <span style={{
            fontSize: 11, color: 'var(--text-3)',
            fontFamily: 'DM Mono, monospace',
            letterSpacing: '0.06em',
          }}>
            v0.1.0-beta
          </span>
        </div>
      </div>
    </div>
  );
}