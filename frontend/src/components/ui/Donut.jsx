// scaleTotal is the denominator the arc fractions are drawn against — defaults to
// the sum of segments (a part-to-whole donut), but a single-segment "rate against
// a fixed 100" ring must pass scaleTotal={100} explicitly, or its one segment
// would always render as a full circle (value / itself = 1).
export default function Donut({ segments, scaleTotal, centerValue, centerLabel }) {
  const cx = 60, cy = 60, r = 46, sw = 14;
  const C = 2 * Math.PI * r;
  const total = scaleTotal ?? (segments.reduce((s, seg) => s + seg.value, 0) || 1);
  let cumulative = 0;
  return (
    <svg viewBox="0 0 120 120" style={{ width: 140, height: 140 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={sw} />
      {segments.map((seg, i) => {
        const len = (seg.value / total) * C || 0;
        const offset = -cumulative;
        cumulative += len;
        return (
          <circle
            key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth={sw}
            strokeDasharray={`${len} ${C - len}`} strokeDashoffset={offset}
            style={{ transform: "rotate(-90deg)", transformOrigin: `${cx}px ${cy}px` }}
          />
        );
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="20" fontWeight="700" fill="#111827">{centerValue}</text>
      {centerLabel && <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="#9ca3af">{centerLabel}</text>}
    </svg>
  );
}
