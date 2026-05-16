export function CoverageRing({ pct, size = 80 }: { pct: number | null; size?: number }) {
  const r = (size / 2) - 10;
  const circ = 2 * Math.PI * r;

  if (pct === null) {
    return (
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <text
          x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
          style={{
            fontSize: size * 0.22, fill: '#5c5c70',
            transform: 'rotate(90deg)', transformOrigin: 'center',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          —
        </text>
      </svg>
    );
  }

  const dash = (pct / 100) * circ;
  const color = pct >= 75 ? '#a3e635' : pct >= 40 ? '#f97316' : '#ef4444';
  const trackColor = pct >= 75
    ? 'rgba(163,230,53,0.12)'
    : pct >= 40
    ? 'rgba(249,115,22,0.12)'
    : 'rgba(239,68,68,0.12)';

  return (
    <svg width={size} height={size} className="rotate-[-90deg]" style={{ filter: `drop-shadow(0 0 6px ${color}50)` }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth="8" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)' }}
      />
      <text
        x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        style={{
          fontSize: size * 0.2, fontWeight: 700, fill: color,
          transform: 'rotate(90deg)', transformOrigin: 'center',
          fontFamily: 'DM Sans, sans-serif',
        }}
      >
        {pct}%
      </text>
    </svg>
  );
}