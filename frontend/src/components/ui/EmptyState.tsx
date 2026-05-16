interface Props {
  icon?: string;
  title: string;
  sub?: string;
}

export function EmptyState({ icon, title, sub }: Props) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '80px 24px', textAlign: 'center', gap: 12,
    }}>
      {icon && (
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'var(--surface-3)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, marginBottom: 4,
        }}>
          {icon}
        </div>
      )}
      <p style={{ fontSize: 15, fontWeight: 600, fontFamily: 'Syne, sans-serif', color: 'var(--text-1)', margin: 0 }}>{title}</p>
      {sub && <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0, maxWidth: 340, lineHeight: 1.6 }}>{sub}</p>}
    </div>
  );
}