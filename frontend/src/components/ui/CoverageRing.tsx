export function CoverageRing({ pct, size = 80 }: { pct: number; size?: number }) {
  const r = (size / 2) - 10;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 75 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444";
  const trackColor = pct >= 75 ? "rgba(16,185,129,0.12)" : pct >= 40 ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)";

  return (
    <svg width={size} height={size} className="rotate-[-90deg]" style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth="8" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)" }}
      />
      <text
        x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        style={{
          fontSize: size * 0.2,
          fontWeight: 700,
          fill: color,
          transform: "rotate(90deg)",
          transformOrigin: "center",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {pct}%
      </text>
    </svg>
  );
}