interface Props {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

export function StatCard({ label, value, sub, accent }: Props) {
  return (
    <div style={{
      background: 'var(--surface-2)', border: `1px solid ${accent ? 'var(--amber-border)' : 'var(--border)'}`,
      borderRadius: 10, padding: '14px 16px',
    }}>
      <p style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, margin: '0 0 6px', fontFamily: 'DM Sans, sans-serif' }}>
        {label}
      </p>
      <p style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: accent ? 'var(--amber)' : 'var(--text-1)', margin: '0 0 2px', letterSpacing: '-0.03em' }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>{sub}</p>}
    </div>
  );
}