import { useState, useEffect } from "react";
import api from "../../services/api";
import {
  FiCalendar, FiDownload, FiFileText, FiChevronDown,
  FiTrendingUp, FiTrendingDown, FiCheckCircle, FiFolder,
  FiZap, FiClock, FiStar, FiBarChart2,
} from "react-icons/fi";
import "./Reports.css";

// ── Constants ─────────────────────────────────────────────────────────────────

const STAT_META = [
  { label: "TOTAL TICKETS",  key: "total_tickets",  trend: "up",   trendText: "vs last month",     color: "#2563eb", bg: "#eff6ff", icon: "ticket" },
  { label: "ASSETS MANAGED", key: "assets_managed", trend: "up",   trendText: "in inventory",       color: "#7c3aed", bg: "#faf5ff", icon: "asset"  },
  { label: "ACTIVE USERS",   key: "active_users",   trend: "up",   trendText: "currently active",   color: "#16a34a", bg: "#f0fdf4", icon: "users"  },
  { label: "SLA COMPLIANCE", key: "sla_compliance", trend: "auto", trendText: "resolution rate",    color: "#ea580c", bg: "#fff7ed", icon: "sla"    },
];

const recentReports = [
  { id: "RPT-042", name: "Monthly Ticket Report",  category: "Helpdesk Ops",   author: "John Doe",  date: "Oct 24, 2023" },
  { id: "RPT-041", name: "Asset Inventory Report", category: "Infrastructure", author: "Alex Smith", date: "Oct 23, 2023" },
  { id: "RPT-040", name: "Department Performance", category: "KPI Tracking",   author: "Emma Moore", date: "Oct 22, 2023" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function polyline(data, W, H, pad = 20) {
  if (!data || data.length === 0) return "";
  const max = Math.max(...data, 1);
  return data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v / max) * (H - pad * 2));
    return `${x},${y}`;
  }).join(" ");
}

// ── Charts ────────────────────────────────────────────────────────────────────

function TicketTrendsChart({ mode, trends }) {
  const W = 340, H = 120;
  const data = mode === "Volume"
    ? (trends?.volume || [])
    : (trends?.resolution || []);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
      {[0.25, 0.5, 0.75].map((f, i) => (
        <line key={i} x1={20} y1={20 + f * (H - 40)} x2={W - 20} y2={20 + f * (H - 40)}
          stroke="#f3f4f6" strokeWidth="1" />
      ))}
      {data.length > 0 && (
        <polyline points={polyline(data, W, H)} fill="none"
          stroke="#2563eb" strokeWidth="2.5" strokeLinejoin="round" />
      )}
    </svg>
  );
}

function StatusDonut({ byStatus }) {
  const items = byStatus?.items || [];
  const total = byStatus?.total || 0;
  const r = 52, cx = 70, cy = 70, circ = 2 * Math.PI * r;
  let offset = 0;
  const segs = items.map(s => {
    const dash = (s.pct / 100) * circ;
    const seg  = { ...s, dash, offset };
    offset += dash;
    return seg;
  });
  return (
    <svg viewBox="0 0 140 140" width={140} height={140}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth="16" />
      {segs.map((s, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none"
          stroke={s.color} strokeWidth="16"
          strokeDasharray={`${s.dash} ${circ - s.dash}`}
          strokeDashoffset={circ * 0.25 - s.offset}
          transform={`rotate(-90 ${cx} ${cy})`} />
      ))}
      <text x={cx} y={cy - 6}  textAnchor="middle" fontSize="18" fontWeight="700" fill="#111827">{total}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9"  fill="#9ca3af">Total</text>
    </svg>
  );
}

function AssetPieChart({ assetCats }) {
  const cats  = assetCats || [];
  const cx = 65, cy = 65, r = 55;
  let angle = -90;
  const toRad = d => (d * Math.PI) / 180;
  const slices = cats.map(c => {
    const sweep = (c.pct / 100) * 360;
    const s  = angle;
    angle += sweep;
    const x1 = cx + r * Math.cos(toRad(s));
    const y1 = cy + r * Math.sin(toRad(s));
    const x2 = cx + r * Math.cos(toRad(angle));
    const y2 = cy + r * Math.sin(toRad(angle));
    return { ...c, d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${x2} ${y2} Z` };
  });
  return (
    <svg viewBox="0 0 130 130" width={130} height={130}>
      {slices.length > 0
        ? slices.map((s, i) => <path key={i} d={s.d} fill={s.color} opacity={0.92} />)
        : <circle cx={cx} cy={cy} r={r} fill="#f3f4f6" />}
      <circle cx={cx} cy={cy} r={28} fill="#fff" />
    </svg>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Reports() {
  const [trendMode,  setTrendMode]  = useState("Volume");
  const [summary,    setSummary]    = useState(null);
  const [trends,     setTrends]     = useState(null);
  const [byStatus,   setByStatus]   = useState(null);
  const [byDept,     setByDept]     = useState([]);
  const [assetCats,  setAssetCats]  = useState([]);
  const [topAgents,  setTopAgents]  = useState([]);
  const [health,     setHealth]     = useState([]);

  useEffect(() => {
    api.get("reports/summary/").then(r => setSummary(r.data)).catch(() => {});
    api.get("reports/ticket-trends/").then(r => setTrends(r.data)).catch(() => {});
    api.get("reports/tickets-by-status/").then(r => setByStatus(r.data)).catch(() => {});
    api.get("reports/tickets-by-dept/").then(r => setByDept(r.data)).catch(() => {});
    api.get("reports/assets-by-category/").then(r => setAssetCats(r.data)).catch(() => {});
    api.get("reports/top-agents/").then(r => setTopAgents(r.data)).catch(() => {});
    api.get("reports/system-health/").then(r => setHealth(r.data)).catch(() => {});
  }, []);

  const trendDays = trends?.days || ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const maxAgent  = Math.max(...topAgents.map(a => a.solved), 1);

  return (
    <div className="rpt-page">
      <div className="rpt-content-wrap">
        {/* ── Main column ── */}
        <div className="rpt-main">

          {/* Header */}
          <div className="rpt-page-header">
            <div>
              <h1 className="rpt-page-title">Reports &amp; Analytics</h1>
              <p className="rpt-page-sub">Monitor helpdesk performance and asset utilization across your IT infrastructure.</p>
            </div>
            <div className="rpt-header-actions">
              <button className="rpt-btn-ghost">
                <FiCalendar size={13} /> Last 30 Days <FiChevronDown size={12} />
              </button>
              <button className="rpt-btn-ghost"><FiDownload size={13} /> Export</button>
            </div>
          </div>

          {/* Stat cards */}
          <div className="rpt-stats-row">
            {STAT_META.map(s => {
              const val  = summary ? summary[s.key] : null;
              const disp = val === null ? "—"
                : s.key === "sla_compliance" ? `${val}%`
                : val.toLocaleString();
              const dir = s.trend === "auto"
                ? (val !== null && val >= 90 ? "up" : "down")
                : s.trend;
              return (
                <div key={s.label} className="rpt-stat-card">
                  <div className="rpt-stat-icon" style={{ background: s.bg }}>
                    {s.icon === "ticket" && <FiFileText    size={20} color={s.color} />}
                    {s.icon === "asset"  && <FiFolder      size={20} color={s.color} />}
                    {s.icon === "users"  && <FiCheckCircle size={20} color={s.color} />}
                    {s.icon === "sla"    && <FiZap         size={20} color={s.color} />}
                  </div>
                  <div className="rpt-stat-body">
                    <p className="rpt-stat-label">{s.label}</p>
                    <p className="rpt-stat-value">{disp}</p>
                    <p className={`rpt-stat-trend rpt-trend-${dir}`}>
                      {dir === "up" ? <FiTrendingUp size={11} /> : <FiTrendingDown size={11} />}
                      {dir === "up" ? "↑" : "↓"} {s.trendText}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts row 1: Ticket Trends + Status Donut */}
          <div className="rpt-charts-row">
            <div className="rpt-chart-card rpt-chart-lg">
              <div className="rpt-chart-header">
                <h3 className="rpt-chart-title">Ticket Trends</h3>
                <div className="rpt-trend-toggle">
                  {["Volume", "Resolution"].map(m => (
                    <button key={m}
                      className={`rpt-trend-btn ${trendMode === m ? "rpt-trend-active" : ""}`}
                      onClick={() => setTrendMode(m)}>{m}</button>
                  ))}
                </div>
              </div>
              <div className="rpt-trend-chart">
                <TicketTrendsChart mode={trendMode} trends={trends} />
              </div>
              <div className="rpt-trend-labels">
                {trendDays.map(d => <span key={d}>{d}</span>)}
              </div>
            </div>

            <div className="rpt-chart-card rpt-chart-sm">
              <h3 className="rpt-chart-title">Tickets by Status</h3>
              <div className="rpt-status-wrap">
                <StatusDonut byStatus={byStatus} />
                <ul className="rpt-status-legend">
                  {(byStatus?.items || []).map(s => (
                    <li key={s.label}>
                      <span className="rpt-legend-dot" style={{ background: s.color }} />
                      <span className="rpt-legend-label">{s.label}</span>
                      <span className="rpt-legend-count">{s.count} ({s.pct}%)</span>
                    </li>
                  ))}
                  {!byStatus && (
                    <li style={{ color: "#9ca3af", fontSize: "12px" }}>Loading…</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Charts row 2: By Dept + Assets by Category */}
          <div className="rpt-charts-row">
            <div className="rpt-chart-card rpt-chart-half">
              <h3 className="rpt-chart-title">Tickets by Department</h3>
              <ul className="rpt-dept-list">
                {byDept.length === 0
                  ? <li style={{ color: "#9ca3af", fontSize: "13px" }}>No ticket data yet</li>
                  : byDept.map(d => (
                    <li key={d.label} className="rpt-dept-item">
                      <div className="rpt-dept-top">
                        <span className="rpt-dept-label">{d.label}</span>
                        <span className="rpt-dept-count">{d.count}</span>
                      </div>
                      <div className="rpt-dept-bar-bg">
                        <div className="rpt-dept-bar" style={{ width: `${d.pct}%`, background: "#2563eb" }} />
                      </div>
                    </li>
                  ))}
              </ul>
            </div>

            <div className="rpt-chart-card rpt-chart-half">
              <h3 className="rpt-chart-title">Assets by Category</h3>
              <div className="rpt-asset-cat-wrap">
                <AssetPieChart assetCats={assetCats} />
                <ul className="rpt-asset-legend">
                  {assetCats.length === 0
                    ? <li style={{ color: "#9ca3af", fontSize: "13px" }}>No assets yet</li>
                    : assetCats.map(c => (
                      <li key={c.label}>
                        <span className="rpt-legend-dot" style={{ background: c.color }} />
                        <span>{c.label} ({c.pct}%)</span>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Top Agents */}
          <div className="rpt-chart-card" style={{ marginBottom: 0 }}>
            <h3 className="rpt-chart-title" style={{ padding: "16px 20px 0" }}>Top Performing Support Agents</h3>
            <ul className="rpt-agents-list" style={{ padding: "12px 20px 16px" }}>
              {topAgents.length === 0
                ? <li style={{ color: "#9ca3af", fontSize: "13px" }}>No resolved tickets assigned to agents yet</li>
                : topAgents.map(a => (
                  <li key={a.name} className="rpt-agent-item">
                    <span className="rpt-agent-avatar" style={{ background: a.color + "22", color: a.color }}>
                      {a.initials}
                    </span>
                    <div className="rpt-agent-info">
                      <div className="rpt-agent-top">
                        <span className="rpt-agent-name">{a.name}</span>
                        <span className="rpt-agent-solved">{a.solved} Solved</span>
                      </div>
                      <div className="rpt-agent-bar-bg">
                        <div className="rpt-agent-bar"
                          style={{ width: `${a.bar_pct}%`, background: a.color }} />
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          </div>

          {/* KPI row — static (no resolution time / satisfaction tracking yet) */}
          <div className="rpt-kpi-row">
            <div className="rpt-kpi-card rpt-kpi-blue">
              <div className="rpt-kpi-icon"><FiClock size={28} /></div>
              <div>
                <p className="rpt-kpi-label">AVERAGE RESOLUTION TIME</p>
                <p className="rpt-kpi-value">4h 28m</p>
                <p className="rpt-kpi-note">↑ 12% faster than last month</p>
              </div>
            </div>
            <div className="rpt-kpi-card rpt-kpi-teal">
              <div className="rpt-kpi-icon"><FiStar size={28} /></div>
              <div>
                <p className="rpt-kpi-label">CUSTOMER SATISFACTION</p>
                <p className="rpt-kpi-value">4.8 / 5</p>
                <p className="rpt-kpi-note">↑ 6% higher rating index</p>
              </div>
            </div>
          </div>

          {/* Recent Reports — static (no report log model) */}
          <div className="rpt-recent-card">
            <div className="rpt-recent-header">
              <h3 className="rpt-recent-title">Recent Reports</h3>
              <button className="rpt-view-all">View All</button>
            </div>
            <div className="rpt-table-wrap">
              <table className="rpt-table">
                <thead>
                  <tr>
                    <th>REPORT NAME</th>
                    <th>CATEGORY</th>
                    <th>GENERATED BY</th>
                    <th>DATE</th>
                    <th>STATUS</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recentReports.map(r => (
                    <tr key={r.id} className="rpt-row">
                      <td className="rpt-cell-name">{r.name}</td>
                      <td className="rpt-cell-cat">{r.category}</td>
                      <td style={{ color: "#6b7280" }}>{r.author}</td>
                      <td className="rpt-cell-date">{r.date}</td>
                      <td><span className="rpt-status-badge">COMPLETED</span></td>
                      <td>
                        <button className="rpt-action-btn"><FiDownload size={13} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* ── Right sidebar ── */}
        <aside className="rpt-sidebar">

          {/* System Health */}
          <div className="rpt-sidebar-card">
            <h3 className="rpt-sidebar-section">SYSTEM HEALTH</h3>
            <ul className="rpt-health-list">
              {health.map(h => (
                <li key={h.label} className="rpt-health-item">
                  <div className="rpt-health-top">
                    <span className="rpt-health-label">{h.label}</span>
                    <span className="rpt-health-val" style={{ color: h.color }}>{h.value}%</span>
                  </div>
                  <div className="rpt-health-bar-bg">
                    <div className="rpt-health-bar"
                      style={{ width: `${Math.min(h.value, 100)}%`, background: h.color }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Report Categories — static */}
          <div className="rpt-sidebar-card">
            <h3 className="rpt-sidebar-section">REPORT CATEGORIES</h3>
            <ul className="rpt-categories">
              {[
                { label: "Operational Metrics",   count: 12, Icon: FiBarChart2   },
                { label: "Compliance & Security", count: 5,  Icon: FiCheckCircle },
                { label: "Financial Analysis",    count: 8,  Icon: FiFileText    },
              ].map(({ label, count, Icon }) => (
                <li key={label} className="rpt-cat-item">
                  <Icon size={14} color="#6b7280" />
                  <span className="rpt-cat-label">{label}</span>
                  <span className="rpt-cat-count">{count}</span>
                </li>
              ))}
            </ul>
          </div>

        </aside>
      </div>
    </div>
  );
}
