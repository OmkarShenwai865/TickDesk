import { useEffect, useState } from "react";
import api from "../../services/api";
import "./Dashboard.css";

import SummaryCard from "../../components/ui/SummaryCard";

import {
    FiClipboard,
    FiUsers,
    FiLayers,
    FiPlus,
    FiMonitor,
    FiUserPlus,
    FiFileText,
    FiCalendar,
    FiAlertTriangle,
    FiAlertCircle,
    FiArrowRight,
    FiChevronDown,
    FiClock,
} from "react-icons/fi";

// ─── Colour maps ───────────────────────────────────────────────────────────────

const TICKET_STATUS_COLORS = {
    Open:        "#3b82f6",
    "In Progress": "#f97316",
    Resolved:    "#22c55e",
    Closed:      "#6b7280",
    Pending:     "#eab308",
};

const ASSET_CATEGORY_COLORS = {
    Laptop:     "#3b82f6",
    Desktop:    "#22c55e",
    Monitor:    "#f97316",
    Printer:    "#8b5cf6",
    Server:     "#ef4444",
    Networking: "#06b6d4",
    Other:      "#94a3b8",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toSegments(data, labelKey, colorMap) {
    const total = data.reduce((s, r) => s + r.count, 0);
    return data.map(r => ({
        label: r[labelKey],
        count: r.count,
        pct:   total ? +((r.count / total) * 100).toFixed(1) : 0,
        color: colorMap[r[labelKey]] ?? "#94a3b8",
    }));
}

function fmtDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
    });
}

// ─── Static sidebar data (not in API yet) ─────────────────────────────────────

const quickActions = [
    { label: "Create Ticket",   Icon: FiPlus,     color: "#2563eb", bg: "#eff6ff" },
    { label: "Add Asset",       Icon: FiMonitor,  color: "#16a34a", bg: "#f0fdf4" },
    { label: "Add User",        Icon: FiUserPlus, color: "#7c3aed", bg: "#f5f3ff" },
    { label: "Generate Report", Icon: FiFileText, color: "#ea580c", bg: "#fff7ed" },
];

// ─── DonutChart ────────────────────────────────────────────────────────────────

function DonutChart({ segments, total }) {
    const cx = 65, cy = 65, r = 50, sw = 14;
    const C = 2 * Math.PI * r;
    let cumulative = 0;

    return (
        <svg viewBox="0 0 130 130" className="donut-svg">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={sw} />
            {segments.map((seg, i) => {
                const len    = (seg.pct / 100) * C;
                const offset = -cumulative;
                cumulative  += len;
                return (
                    <circle
                        key={i}
                        cx={cx} cy={cy} r={r}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth={sw}
                        strokeDasharray={`${len} ${C - len}`}
                        strokeDashoffset={offset}
                        strokeLinecap="butt"
                        style={{ transform: "rotate(-90deg)", transformOrigin: `${cx}px ${cy}px` }}
                    />
                );
            })}
            <text x={cx} y={cy - 5}  textAnchor="middle" className="donut-center-label">Total</text>
            <text x={cx} y={cy + 17} textAnchor="middle" className="donut-center-value">{total}</text>
        </svg>
    );
}

// ─── SLA Ring ──────────────────────────────────────────────────────────────────

function SLARing({ pct }) {
    const cx = 60, cy = 60, r = 46, sw = 10;
    const C      = 2 * Math.PI * r;
    const filled = (pct / 100) * C;
    return (
        <svg viewBox="0 0 120 120" className="sla-svg">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={sw} />
            <circle
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke="#2563eb"
                strokeWidth={sw}
                strokeDasharray={`${filled} ${C - filled}`}
                strokeDashoffset={0}
                strokeLinecap="round"
                style={{ transform: "rotate(-90deg)", transformOrigin: `${cx}px ${cy}px` }}
            />
            <text x={cx} y={cy + 7} textAnchor="middle" className="sla-center-pct">{pct}%</text>
        </svg>
    );
}

// ─── Inline badge helpers ──────────────────────────────────────────────────────

function PriorityBadge({ priority }) {
    return <span className={`pri-badge pri-${priority.toLowerCase()}`}>{priority}</span>;
}

function TicketStatusBadge({ status }) {
    const key = status.toLowerCase().replace(/\s+/g, "-");
    return <span className={`sta-badge sta-${key}`}>{status}</span>;
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

function Dashboard() {
    const [userName,          setUserName]          = useState("Admin");
    const [stats,             setStats]             = useState(null);
    const [ticketSegments,    setTicketSegments]    = useState([]);
    const [assetSegments,     setAssetSegments]     = useState([]);
    const [recentTickets,     setRecentTickets]     = useState([]);
    const [recentAssets,      setRecentAssets]      = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                const [profile, statsRes, ticketStatus, assetDist, tickets, assets] =
                    await Promise.all([
                        api.get("accounts/profile/"),
                        api.get("dashboard/stats/"),
                        api.get("dashboard/ticket-status/"),
                        api.get("dashboard/asset-distribution/"),
                        api.get("dashboard/recent-tickets/"),
                        api.get("dashboard/recent-assets/"),
                    ]);

                const u = profile.data;
                setUserName(u.first_name || u.username || "Admin");

                setStats(statsRes.data);

                setTicketSegments(toSegments(ticketStatus.data, "status",   TICKET_STATUS_COLORS));
                setAssetSegments (toSegments(assetDist.data,    "category", ASSET_CATEGORY_COLORS));

                setRecentTickets(tickets.data);
                setRecentAssets (assets.data);
            } catch (err) {
                console.error("Dashboard load error:", err);
            }
        };
        load();
    }, []);

    const totalTickets = ticketSegments.reduce((s, seg) => s + seg.count, 0);
    const totalAssets  = assetSegments.reduce((s, seg) => s + seg.count, 0);

    const today = new Date().toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
    });

    return (
        <div className="dashboard">

            {/* ── Welcome ── */}
            <section className="welcome-section">
                <div>
                    <h1>Welcome back, {userName}! 👋</h1>
                    <p>Here&apos;s what&apos;s happening with your IT environment today.</p>
                </div>
                <div className="welcome-date">
                    <FiCalendar size={15} />
                    <span>{today}</span>
                    <FiChevronDown size={14} />
                </div>
            </section>

            {/* ── Summary Cards ── */}
            <section className="summary-grid">
                <SummaryCard icon={<FiMonitor />}   title="Total Assets"  value={stats?.total_assets  ?? "—"} change="+12.5% from last month" iconColor="#2563eb" iconBg="#eff6ff" />
                <SummaryCard icon={<FiClipboard />} title="Open Tickets"  value={stats?.open_tickets  ?? "—"} change="-8.3% from last month"  positive={false} iconColor="#16a34a" iconBg="#f0fdf4" />
                <SummaryCard icon={<FiUsers />}     title="Users"         value={stats?.total_users   ?? "—"} change="+5.2% from last month"  iconColor="#7c3aed" iconBg="#f5f3ff" />
                <SummaryCard icon={<FiLayers />}    title="Departments"   value={stats?.total_departments ?? "—"} change="+3.1% from last month" iconColor="#ea580c" iconBg="#fff7ed" />
            </section>

            {/* ── Main Body ── */}
            <main className="dashboard-body">

                {/* ── Left Content ── */}
                <section className="dashboard-content">

                    {/* Recent Tickets */}
                    <div className="db-card">
                        <div className="card-header">
                            <h2>Recent Tickets</h2>
                            <a href="#" className="view-all-link">View all</a>
                        </div>
                        <div className="table-scroll">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Ticket ID</th>
                                        <th>Subject</th>
                                        <th>Requester</th>
                                        <th>Priority</th>
                                        <th>Status</th>
                                        <th>Created At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentTickets.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} style={{ textAlign: "center", color: "#94a3b8", padding: "1.5rem" }}>
                                                No tickets yet
                                            </td>
                                        </tr>
                                    ) : recentTickets.map(t => (
                                        <tr key={t.id}>
                                            <td>
                                                <span className="row-dot" />
                                                {t.ticket_number}
                                            </td>
                                            <td>{t.title}</td>
                                            <td>{t.created_by ?? "—"}</td>
                                            <td><PriorityBadge priority={t.priority} /></td>
                                            <td><TicketStatusBadge status={t.status} /></td>
                                            <td>{fmtDate(t.created_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Ticket Status Overview */}
                    <div className="db-card">
                        <div className="card-header">
                            <h2>Ticket Status Overview</h2>
                        </div>
                        <div className="chart-area">
                            <DonutChart segments={ticketSegments} total={totalTickets} />
                            <div className="chart-legend">
                                {ticketSegments.length === 0 ? (
                                    <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>No ticket data</p>
                                ) : ticketSegments.map(s => (
                                    <div key={s.label} className="legend-row">
                                        <span className="legend-dot" style={{ background: s.color }} />
                                        <span className="legend-label">{s.label}</span>
                                        <span className="legend-stat">{s.count} ({s.pct}%)</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Recently Added Assets */}
                    <div className="db-card">
                        <div className="card-header">
                            <h2>Recently Added Assets</h2>
                            <a href="#" className="view-all-link">View all</a>
                        </div>
                        <div className="table-scroll">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Asset ID</th>
                                        <th>Asset Name</th>
                                        <th>Type</th>
                                        <th>Assigned To</th>
                                        <th>Added On</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentAssets.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: "center", color: "#94a3b8", padding: "1.5rem" }}>
                                                No assets yet
                                            </td>
                                        </tr>
                                    ) : recentAssets.map(a => (
                                        <tr key={a.id}>
                                            <td>{a.asset_tag}</td>
                                            <td>{a.asset_name}</td>
                                            <td>{a.category}</td>
                                            <td>{a.assigned_to ?? "Unassigned"}</td>
                                            <td>{fmtDate(a.purchase_date)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Asset Distribution */}
                    <div className="db-card">
                        <div className="card-header">
                            <h2>Asset Distribution</h2>
                        </div>
                        <div className="chart-area">
                            <DonutChart segments={assetSegments} total={totalAssets} />
                            <div className="chart-legend">
                                {assetSegments.length === 0 ? (
                                    <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>No asset data</p>
                                ) : assetSegments.map(s => (
                                    <div key={s.label} className="legend-row">
                                        <span className="legend-dot" style={{ background: s.color }} />
                                        <span className="legend-label">{s.label}</span>
                                        <span className="legend-stat">{s.count} ({s.pct}%)</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </section>

                {/* ── Right Sidebar ── */}
                <aside className="right-sidebar">

                    {/* Quick Actions */}
                    <div className="db-card sidebar-card">
                        <h2 className="sidebar-card-title">Quick Actions</h2>
                        <div className="qa-grid">
                            {quickActions.map(({ label, Icon, color, bg }) => (
                                <button
                                    key={label}
                                    className="qa-btn"
                                    style={{ "--qa-bg": bg, "--qa-color": color }}
                                >
                                    <span className="qa-icon"><Icon /></span>
                                    <span className="qa-label">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* SLA Compliance */}
                    <div className="db-card sidebar-card">
                        <h2 className="sidebar-card-title">SLA Compliance</h2>
                        <div className="sla-body">
                            <SLARing pct={85} />
                            <div className="sla-info">
                                <p className="sla-heading">Good Job!</p>
                                <p className="sla-desc">You are meeting most of your SLA targets.</p>
                                <a href="#" className="icon-link">
                                    View SLA Report <FiArrowRight size={13} />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Upcoming Maintenance */}
                    <div className="db-card sidebar-card">
                        <h2 className="sidebar-card-title">Upcoming Maintenance</h2>
                        <div className="maint-item">
                            <div className="maint-icon-wrap">
                                <FiCalendar />
                            </div>
                            <div className="maint-details">
                                <p className="maint-title">Windows Server Update</p>
                                <p className="maint-date">Scheduled on May 30, 2025</p>
                                <p className="maint-time">
                                    <FiClock size={12} />
                                    10:00 PM – 2:00 AM
                                </p>
                            </div>
                        </div>
                        <a href="#" className="icon-link maint-link">
                            View all maintenance <FiArrowRight size={13} />
                        </a>
                    </div>

                    {/* System Alerts */}
                    <div className="db-card sidebar-card">
                        <div className="card-header">
                            <h2>System Alerts</h2>
                            <a href="#" className="view-all-link">View all</a>
                        </div>
                        <div className="alerts-list">
                            <div className="alert-item alert-critical">
                                <FiAlertTriangle className="alert-icon" />
                                <div>
                                    <p className="alert-msg">3 critical assets are not compliant</p>
                                    <a href="#" className="alert-link">View details <FiArrowRight size={11} /></a>
                                </div>
                            </div>
                            <div className="alert-item alert-warning">
                                <FiAlertCircle className="alert-icon" />
                                <div>
                                    <p className="alert-msg">
                                        {stats?.open_tickets ?? 0} tickets are waiting for assignment
                                    </p>
                                    <a href="#" className="alert-link">View tickets <FiArrowRight size={11} /></a>
                                </div>
                            </div>
                        </div>
                    </div>

                </aside>

            </main>

        </div>
    );
}

export default Dashboard;
