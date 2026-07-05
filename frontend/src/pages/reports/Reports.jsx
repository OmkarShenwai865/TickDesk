import { useState } from "react";
import {
  FiCalendar, FiDownload, FiFileText, FiChevronDown,
  FiTrendingUp, FiTrendingDown, FiCheckCircle, FiFolder,
  FiZap, FiClock, FiStar, FiBarChart2,
} from "react-icons/fi";
import "./Reports.css";

// ── Data ──────────────────────────────────────────────────────────────────────
const statCards = [
  { label: "TOTAL TICKETS",  value: "248", trend: { dir: "up",   text: "14% vs last month" },     color: "#2563eb", bg: "#eff6ff", icon: "ticket" },
  { label: "ASSETS MANAGED", value: "512", trend: { dir: "up",   text: "2.1% organic growth" },    color: "#7c3aed", bg: "#faf5ff", icon: "asset"  },
  { label: "ACTIVE USERS",   value: "214", trend: { dir: "up",   text: "4 new signups" },           color: "#16a34a", bg: "#f0fdf4", icon: "users"  },
  { label: "SLA COMPLIANCE", value: "94%", trend: { dir: "down", text: "0.4% performance dip" },   color: "#ea580c", bg: "#fff7ed", icon: "sla"    },
];

const byStatusData = [
  { label: "Open",        count: 142, pct: 57, color: "#2563eb" },
  { label: "In Progress", count: 86,  pct: 35, color: "#1d4ed8" },
  { label: "Overdue",     count: 20,  pct: 8,  color: "#93c5fd" },
];

const byDept = [
  { label: "Engineering", count: 92 },
  { label: "Marketing",   count: 45 },
  { label: "Sales",       count: 78 },
  { label: "HR",          count: 33 },
];

const assetCategories = [
  { label: "Laptops", pct: 40, color: "#1d4ed8" },
  { label: "Servers", pct: 30, color: "#2563eb"  },
  { label: "Other",   pct: 30, color: "#93c5fd"  },
];

const topAgents = [
  { name: "Sarah Connor",  solved: 154, initials: "SC", color: "#2563eb" },
  { name: "Marcus Wright", solved: 132, initials: "MW", color: "#7c3aed" },
  { name: "Kyle Reese",    solved: 98,  initials: "KR", color: "#16a34a" },
];

const systemHealth = [
  { label: "Resolution Rate",  value: 92,   color: "#16a34a" },
  { label: "Asset Utilization",value: 64,   color: "#2563eb" },
  { label: "SLA Uptime",       value: 99.9, color: "#16a34a" },
];

const recentReports = [
  { id: "RPT-042", name: "Monthly Ticket Report",   category: "Helpdesk Ops",  author: "John Doe",   date: "Oct 24, 2023" },
  { id: "RPT-041", name: "Asset Inventory Report",  category: "Infrastructure",author: "Alex Smith",  date: "Oct 23, 2023" },
  { id: "RPT-040", name: "Department Performance",  category: "KPI Tracking",  author: "Emma Moore",  date: "Oct 22, 2023" },
];

// ── Charts ────────────────────────────────────────────────────────────────────
const trendDays  = ["MON","TUE","WED","THU","FRI","SAT","SUN"];
const volumeData = [30, 55, 45, 70, 60, 40, 65];
const resolutionData = [20, 35, 40, 50, 45, 35, 55];

function polyline(data, W, H, pad = 20) {
  const max = Math.max(...data);
  return data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v / max) * (H - pad * 2));
    return `${x},${y}`;
  }).join(" ");
}

function TicketTrendsChart({ mode }) {
  const W = 340, H = 120;
  const data = mode === "Volume" ? volumeData : resolutionData;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
      {[0.25, 0.5, 0.75].map((f, i) => (
        <line key={i} x1={20} y1={20 + f*(H-40)} x2={W-20} y2={20 + f*(H-40)} stroke="#f3f4f6" strokeWidth="1" />
      ))}
      <polyline points={polyline(data, W, H)} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

function StatusDonut() {
  const r = 52, cx = 70, cy = 70, circ = 2 * Math.PI * r;
  let offset = 0;
  const segs = byStatusData.map(s => {
    const dash = (s.pct / 100) * circ;
    const seg = { ...s, dash, offset };
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
      <text x={cx} y={cy-6}  textAnchor="middle" fontSize="18" fontWeight="700" fill="#111827">248</text>
      <text x={cx} y={cy+10} textAnchor="middle" fontSize="9"  fill="#9ca3af">Total</text>
    </svg>
  );
}

function AssetPieChart() {
  const cx = 65, cy = 65, r = 55;
  let angle = -90;
  const toRad = d => (d * Math.PI) / 180;
  const slices = assetCategories.map(c => {
    const sweep = (c.pct / 100) * 360;
    const s = angle; angle += sweep;
    const x1 = cx + r * Math.cos(toRad(s)),   y1 = cy + r * Math.sin(toRad(s));
    const x2 = cx + r * Math.cos(toRad(angle)), y2 = cy + r * Math.sin(toRad(angle));
    return { ...c, d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${x2} ${y2} Z` };
  });
  return (
    <svg viewBox="0 0 130 130" width={130} height={130}>
      {slices.map((s, i) => <path key={i} d={s.d} fill={s.color} opacity={0.92} />)}
      <circle cx={cx} cy={cy} r={28} fill="#fff" />
    </svg>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Reports() {
  const [trendMode, setTrendMode] = useState("Volume");

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
            {statCards.map((s) => (
              <div key={s.label} className="rpt-stat-card">
                <div className="rpt-stat-icon" style={{ background: s.bg }}>
                  {s.icon === "ticket" && <FiFileText  size={20} color={s.color} />}
                  {s.icon === "asset"  && <FiFolder    size={20} color={s.color} />}
                  {s.icon === "users"  && <FiCheckCircle size={20} color={s.color} />}
                  {s.icon === "sla"    && <FiZap       size={20} color={s.color} />}
                </div>
                <div className="rpt-stat-body">
                  <p className="rpt-stat-label">{s.label}</p>
                  <p className="rpt-stat-value">{s.value}</p>
                  <p className={`rpt-stat-trend rpt-trend-${s.trend.dir}`}>
                    {s.trend.dir === "up" ? <FiTrendingUp size={11} /> : <FiTrendingDown size={11} />}
                    {s.trend.dir === "up" ? "↑" : "↓"} {s.trend.text}
                  </p>
                </div>
              </div>
            ))}
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
              <div className="rpt-trend-chart"><TicketTrendsChart mode={trendMode} /></div>
              <div className="rpt-trend-labels">{trendDays.map(d => <span key={d}>{d}</span>)}</div>
            </div>

            <div className="rpt-chart-card rpt-chart-sm">
              <h3 className="rpt-chart-title">Tickets by Status</h3>
              <div className="rpt-status-wrap">
                <StatusDonut />
                <ul className="rpt-status-legend">
                  {byStatusData.map(s => (
                    <li key={s.label}>
                      <span className="rpt-legend-dot" style={{ background: s.color }} />
                      <span className="rpt-legend-label">{s.label}</span>
                      <span className="rpt-legend-count">{s.count} ({s.pct}%)</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Charts row 2: By Dept + Assets by Category */}
          <div className="rpt-charts-row">
            <div className="rpt-chart-card rpt-chart-half">
              <h3 className="rpt-chart-title">Tickets by Department</h3>
              <ul className="rpt-dept-list">
                {byDept.map(d => (
                  <li key={d.label} className="rpt-dept-item">
                    <div className="rpt-dept-top">
                      <span className="rpt-dept-label">{d.label}</span>
                      <span className="rpt-dept-count">{d.count}</span>
                    </div>
                    <div className="rpt-dept-bar-bg">
                      <div className="rpt-dept-bar" style={{ width: `${(d.count / 100) * 100}%`, background: "#2563eb" }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rpt-chart-card rpt-chart-half">
              <h3 className="rpt-chart-title">Assets by Category</h3>
              <div className="rpt-asset-cat-wrap">
                <AssetPieChart />
                <ul className="rpt-asset-legend">
                  {assetCategories.map(c => (
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
              {topAgents.map(a => (
                <li key={a.name} className="rpt-agent-item">
                  <span className="rpt-agent-avatar" style={{ background: a.color + "22", color: a.color }}>{a.initials}</span>
                  <div className="rpt-agent-info">
                    <div className="rpt-agent-top">
                      <span className="rpt-agent-name">{a.name}</span>
                      <span className="rpt-agent-solved">{a.solved} Solved</span>
                    </div>
                    <div className="rpt-agent-bar-bg">
                      <div className="rpt-agent-bar" style={{ width: `${(a.solved / 160) * 100}%`, background: a.color }} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* KPI row */}
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

          {/* Recent Reports */}
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
              {systemHealth.map(h => (
                <li key={h.label} className="rpt-health-item">
                  <div className="rpt-health-top">
                    <span className="rpt-health-label">{h.label}</span>
                    <span className="rpt-health-val" style={{ color: h.color }}>{h.value}%</span>
                  </div>
                  <div className="rpt-health-bar-bg">
                    <div className="rpt-health-bar" style={{ width: `${Math.min(h.value, 100)}%`, background: h.color }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Report Categories */}
          <div className="rpt-sidebar-card">
            <h3 className="rpt-sidebar-section">REPORT CATEGORIES</h3>
            <ul className="rpt-categories">
              {[
                { label: "Operational Metrics",   count: 12, Icon: FiBarChart2  },
                { label: "Compliance & Security", count: 5,  Icon: FiCheckCircle },
                { label: "Financial Analysis",    count: 8,  Icon: FiFileText   },
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
