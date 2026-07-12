export default function AreaChart({ points, color = "#2563eb", height = 140 }) {
  const w = 600, h = height, pad = 4;
  const max = Math.max(...points, 1);
  const step = (w - pad * 2) / (points.length - 1);
  const coords = points.map((p, i) => [pad + i * step, h - pad - (p / max) * (h - pad * 2)]);
  const line = coords.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `${pad},${h - pad} ${line} ${w - pad},${h - pad}`;
  const last = coords[coords.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height, display: "block" }}>
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#f1f5f9" strokeWidth="1" />
      <polygon points={area} fill={color} opacity="0.08" />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="4" fill="#fff" stroke={color} strokeWidth="2" />
      <text x={last[0] - 6} y={last[1] - 10} textAnchor="end" fontSize="11" fontWeight="700" fill="#111827">
        {points[points.length - 1]}
      </text>
    </svg>
  );
}
