import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiBriefcase, FiUsers, FiClipboard, FiTrendingUp, FiHeadphones, FiLayers } from "react-icons/fi";
import StatTile from "../../components/ui/StatTile";
import AreaChart from "../../components/ui/AreaChart";
import Donut from "../../components/ui/Donut";
import api from "../../services/api";
import "../settings/Settings.css";

// Company size distribution — ordered bins that make up the whole company base,
// so a donut (part-to-whole of one total) fits, unlike a per-entity comparison.
const SIZE_COLORS = { "1-5 users": "#2563eb", "6-15 users": "#7c3aed", "16+ users": "#0891b2" };

export default function PlatformDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("platform/dashboard/")
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="st-page" style={{ gridTemplateColumns: "1fr" }}>
        <div className="st-main">
          <p className="st-page-sub">{loading ? "Loading platform analytics…" : "Couldn't load platform analytics."}</p>
        </div>
      </div>
    );
  }

  const { summary, growth, growthMonths, recentRegistrations, sizeBands } = data;

  const summaryTiles = [
    { Icon: FiBriefcase,  label: "TOTAL COMPANIES", value: summary.totalCompanies, delta: summary.companiesDelta, up: true, color: "#2563eb", trend: summary.companiesTrend },
    { Icon: FiUsers,      label: "TOTAL USERS",     value: summary.totalUsers,     delta: summary.usersDelta,     up: true, color: "#16a34a", trend: summary.usersTrend },
    { Icon: FiHeadphones, label: "SUPPORT AGENTS",  value: summary.supportAgents,  delta: summary.agentsDelta,    up: true, color: "#7c3aed", trend: summary.agentsTrend },
    { Icon: FiLayers,     label: "DEPARTMENTS",     value: summary.departments,    delta: summary.deptsDelta,     up: true, color: "#0891b2", trend: summary.deptsTrend },
    { Icon: FiClipboard,  label: "TOTAL TICKETS",   value: summary.totalTickets,   delta: summary.ticketsDelta,   up: true, color: "#ea580c", trend: summary.ticketsTrend },
    { Icon: FiTrendingUp, label: "NEW THIS MONTH",  value: summary.newThisMonth,   delta: summary.monthDelta,     up: summary.monthUp, color: "#dc2626", trend: summary.monthTrend },
  ];

  const totalCompanies = sizeBands.reduce((sum, b) => sum + b.count, 0);

  return (
    <div className="st-page" style={{ gridTemplateColumns: "1fr" }}>
      <div className="st-main">
        <div>
          <h1 className="st-page-title">Dashboard</h1>
          <p className="st-page-sub">Platform-wide growth and adoption across every company on TickDesk.</p>
        </div>

        {/* Summary row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {summaryTiles.map((tile) => <StatTile key={tile.label} {...tile} />)}
        </div>

        {/* Company growth — single series, trend over time: line/area chart, one hue */}
        <div className="st-card">
          <div className="st-card-header">
            <h2 className="st-card-title">Company Growth</h2>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>New registrations, last 6 months ({growthMonths[0]}–{growthMonths[growthMonths.length - 1]})</span>
          </div>
          <div className="st-card-body">
            <AreaChart points={growth} color="#2563eb" />
            <div style={{ display: "flex", marginTop: 6 }}>
              {growthMonths.map((m, i) => (
                <span key={`${m}-${i}`} style={{ flex: 1, textAlign: "center", fontSize: 11, color: "#9ca3af" }}>{m}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Recently registered companies — real fields only, sorted newest first */}
        <div className="st-card">
          <div className="st-card-header">
            <h2 className="st-card-title">Recently Registered</h2>
            <Link to="/platform/companies" style={{ fontSize: 12, color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>
              View All →
            </Link>
          </div>
          <div className="st-table-wrap">
            <table className="st-table">
              <thead>
                <tr><th>COMPANY</th><th>REGISTERED</th><th>STATUS</th></tr>
              </thead>
              <tbody>
                {recentRegistrations.map((c) => (
                  <tr key={c.name}>
                    <td style={{ fontWeight: 600, color: "#111827" }}>{c.name}</td>
                    <td style={{ color: "#6b7280" }}>{c.registered}</td>
                    <td><span className={`st-badge ${c.active ? "st-badge-green" : "st-badge-red"}`}>{c.active ? "Active" : "Suspended"}</span></td>
                  </tr>
                ))}
                {recentRegistrations.length === 0 && (
                  <tr><td colSpan={3} style={{ color: "#9ca3af", textAlign: "center", padding: 24 }}>No companies registered yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Company size distribution — part-to-whole of the total company base: donut */}
        <div className="st-card">
          <div className="st-card-header">
            <h2 className="st-card-title">Company Size Distribution</h2>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>By active user count</span>
          </div>
          <div className="st-card-body" style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <Donut
              segments={sizeBands.map((b) => ({ value: b.count, color: SIZE_COLORS[b.label] }))}
              centerValue={totalCompanies}
              centerLabel="COMPANIES"
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
              {sizeBands.map((b) => (
                <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: SIZE_COLORS[b.label] }} />
                  <span style={{ color: "#374151" }}>{b.label}</span>
                  <span style={{ fontWeight: 700, color: "#111827", marginLeft: "auto" }}>{b.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
