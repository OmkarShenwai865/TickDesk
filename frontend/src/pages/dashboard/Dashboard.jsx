import { useEffect } from "react";
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

// ─── Static data ───────────────────────────────────────────────────────────────

const recentTickets = [
    { id: "TK-1048", subject: "Unable to connect to VPN",    requester: "Rohit Sharma",  priority: "High",   status: "Open",        createdAt: "May 27, 2025" },
    { id: "TK-1047", subject: "System slow performance",     requester: "Sneha Patel",   priority: "Medium", status: "In Progress", createdAt: "May 26, 2025" },
    { id: "TK-1046", subject: "Email not syncing",           requester: "Amit Verma",    priority: "Low",    status: "Pending",     createdAt: "May 26, 2025" },
    { id: "TK-1045", subject: "Printer not working",         requester: "Neha Singh",    priority: "High",   status: "Open",        createdAt: "May 25, 2025" },
    { id: "TK-1044", subject: "Request for new monitor",     requester: "Vikram Reddy",  priority: "Low",    status: "Closed",      createdAt: "May 25, 2025" },
];

const ticketSegments = [
    { label: "Open",        count: 12, pct: 37.5,  color: "#3b82f6" },
    { label: "In Progress", count: 8,  pct: 25,    color: "#f97316" },
    { label: "Pending",     count: 6,  pct: 18.75, color: "#eab308" },
    { label: "Closed",      count: 6,  pct: 18.75, color: "#22c55e" },
];

const recentAssets = [
    { id: "AST-1254", name: 'Dell Latitude 5440',    type: "Laptop",     assignedTo: "Rohit Sharma",  addedOn: "May 27, 2025" },
    { id: "AST-1253", name: "HP LaserJet Pro MFP",   type: "Printer",    assignedTo: "Accounts Dept.",addedOn: "May 26, 2025" },
    { id: "AST-1252", name: "Logitech MX Master 3",  type: "Peripheral", assignedTo: "Sneha Patel",   addedOn: "May 26, 2025" },
    { id: "AST-1251", name: 'Samsung 24" Monitor',   type: "Monitor",    assignedTo: "Amit Verma",    addedOn: "May 25, 2025" },
    { id: "AST-1250", name: "iPhone 14",              type: "Mobile",     assignedTo: "Neha Singh",    addedOn: "May 25, 2025" },
];

const assetSegments = [
    { label: "Laptops",   count: 620, pct: 49.7, color: "#3b82f6" },
    { label: "Desktops",  count: 320, pct: 25.6, color: "#22c55e" },
    { label: "Monitors",  count: 180, pct: 14.4, color: "#f97316" },
    { label: "Others",    count: 128, pct: 10.3, color: "#8b5cf6" },
];

const quickActions = [
    { label: "Create Ticket",    Icon: FiPlus,     color: "#2563eb", bg: "#eff6ff" },
    { label: "Add Asset",        Icon: FiMonitor,  color: "#16a34a", bg: "#f0fdf4" },
    { label: "Add User",         Icon: FiUserPlus, color: "#7c3aed", bg: "#f5f3ff" },
    { label: "Generate Report",  Icon: FiFileText, color: "#ea580c", bg: "#fff7ed" },
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
                const len = (seg.pct / 100) * C;
                const offset = -cumulative;
                cumulative += len;
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
            <text x={cx} y={cy - 5} textAnchor="middle" className="donut-center-label">Total</text>
            <text x={cx} y={cy + 17} textAnchor="middle" className="donut-center-value">{total}</text>
        </svg>
    );
}

// ─── SLA Ring ──────────────────────────────────────────────────────────────────

function SLARing({ pct }) {
    const cx = 60, cy = 60, r = 46, sw = 10;
    const C = 2 * Math.PI * r;
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

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get("accounts/profile/");
                console.log(response.data);
            } catch (error) {
                console.log(error);
            }
        };
        fetchProfile();
    }, []);

    return (
        <div className="dashboard">

            {/* ── Welcome ── */}
            <section className="welcome-section">
                <div>
                    <h1>Welcome back, Admin! 👋</h1>
                    <p>Here&apos;s what&apos;s happening with your IT environment today.</p>
                </div>
                <div className="welcome-date">
                    <FiCalendar size={15} />
                    <span>May 27, 2025</span>
                    <FiChevronDown size={14} />
                </div>
            </section>

            {/* ── Summary Cards ── */}
            <section className="summary-grid">
                <SummaryCard icon={<FiMonitor />}   title="Total Assets"  value="1,248" change="+12.5% from last month" iconColor="#2563eb" iconBg="#eff6ff" />
                <SummaryCard icon={<FiClipboard />} title="Open Tickets"  value="32"    change="-8.3% from last month"  positive={false} iconColor="#16a34a" iconBg="#f0fdf4" />
                <SummaryCard icon={<FiUsers />}     title="Users"         value="156"   change="+5.2% from last month"  iconColor="#7c3aed" iconBg="#f5f3ff" />
                <SummaryCard icon={<FiLayers />}    title="Departments"   value="12"    change="+3.1% from last month"  iconColor="#ea580c" iconBg="#fff7ed" />
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
                                    {recentTickets.map(t => (
                                        <tr key={t.id}>
                                            <td>
                                                <span className="row-dot" />
                                                {t.id}
                                            </td>
                                            <td>{t.subject}</td>
                                            <td>{t.requester}</td>
                                            <td><PriorityBadge priority={t.priority} /></td>
                                            <td><TicketStatusBadge status={t.status} /></td>
                                            <td>{t.createdAt}</td>
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
                            <DonutChart segments={ticketSegments} total="32" />
                            <div className="chart-legend">
                                {ticketSegments.map(s => (
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
                                    {recentAssets.map(a => (
                                        <tr key={a.id}>
                                            <td>{a.id}</td>
                                            <td>{a.name}</td>
                                            <td>{a.type}</td>
                                            <td>{a.assignedTo}</td>
                                            <td>{a.addedOn}</td>
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
                            <DonutChart segments={assetSegments} total="1,248" />
                            <div className="chart-legend">
                                {assetSegments.map(s => (
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
                                    <p className="alert-msg">12 tickets are waiting for assignment</p>
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
