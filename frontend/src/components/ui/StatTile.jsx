import Sparkline from "./Sparkline";

export default function StatTile({ Icon, label, value, delta, up, color, trend }) {
  return (
    <div className="st-card">
      <div className="st-card-body">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9, background: `${color}1a`, color,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Icon size={16} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: up ? "#16a34a" : "#dc2626" }}>{delta}</span>
        </div>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", color: "#9ca3af", margin: "0 0 2px" }}>{label}</p>
        <p style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: trend?.length ? "0 0 8px" : 0 }}>{value}</p>
        {trend?.length > 0 && <Sparkline points={trend} color={color} />}
      </div>
    </div>
  );
}
