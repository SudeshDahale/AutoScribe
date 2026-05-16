export function Spinner({ label }: { label?: string }) {
  return (
    <div style={{ padding: '32px 0', textAlign: 'center' }}>
      <div className="spinner" />
      {label && <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 10 }}>{label}</p>}
    </div>
  );
}