import "./TicketList.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    FiFilter,
    FiDownload,
    FiPlus,
    FiAlertCircle,
    FiClock,
    FiCheckCircle,
    FiMoreVertical,
    FiSearch,
    FiArrowLeft,
    FiArrowRight,
    FiBarChart2,
    FiUsers,
    FiUserPlus,
    FiSettings,
    FiTag,
    FiList,
    FiColumns,
} from "react-icons/fi";

// ─── Static data ──────────────────────────────────────────────────────────────

const tickets = [
    { id: "TK-1048", subject: "Unable to connect to Global VPN",       requester: "Rohit Sharma",  category: "Network",    priority: "high",     status: "progress", assigned: "David Chen",  date: "Oct 25, 2023" },
    { id: "TK-1047", subject: "Laptop screen flickering after update",  requester: "Priya Mehta",   category: "Hardware",   priority: "medium",   status: "open",     assigned: "Sarah Kim",   date: "Oct 24, 2023" },
    { id: "TK-1046", subject: "MS Office activation key not working",   requester: "Arjun Patel",   category: "Software",   priority: "low",      status: "resolved", assigned: "Tom Wright",  date: "Oct 24, 2023" },
    { id: "TK-1045", subject: "Email not syncing on mobile device",     requester: "Neha Singh",    category: "Email",      priority: "medium",   status: "open",     assigned: "David Chen",  date: "Oct 23, 2023" },
    { id: "TK-1044", subject: "Printer offline in Finance department",  requester: "Rajesh Kumar",  category: "Hardware",   priority: "high",     status: "progress", assigned: "Sarah Kim",   date: "Oct 23, 2023" },
    { id: "TK-1043", subject: "Can't access shared drive on Floor 3",   requester: "Anjali Desai",  category: "Network",    priority: "critical", status: "open",     assigned: "Unassigned",  date: "Oct 22, 2023" },
    { id: "TK-1042", subject: "Zoom not connecting to audio devices",   requester: "Vikram Joshi",  category: "Software",   priority: "low",      status: "resolved", assigned: "Tom Wright",  date: "Oct 22, 2023" },
    { id: "TK-1041", subject: "New employee laptop setup request",      requester: "HR Department", category: "Onboarding", priority: "medium",   status: "closed",   assigned: "David Chen",  date: "Oct 21, 2023" },
    { id: "TK-1040", subject: "Antivirus alert on workstation WS-204",  requester: "Sanjay Gupta",  category: "Security",   priority: "critical", status: "progress", assigned: "Sarah Kim",   date: "Oct 21, 2023" },
    { id: "TK-1039", subject: "Keyboard/mouse not working after dock",  requester: "Meera Reddy",   category: "Hardware",   priority: "low",      status: "resolved", assigned: "Tom Wright",  date: "Oct 20, 2023" },
];

const priorityConfig = {
    critical: { label: "Critical", bg: "#fef2f2", color: "#dc2626", dot: "#dc2626" },
    high:     { label: "High",     bg: "#fff7ed", color: "#ea580c", dot: "#ea580c" },
    medium:   { label: "Medium",   bg: "#fffbeb", color: "#d97706", dot: "#d97706" },
    low:      { label: "Low",      bg: "#f0fdf4", color: "#16a34a", dot: "#16a34a" },
};

const statusConfig = {
    open:     { label: "Open",        bg: "#eff6ff", color: "#2563eb" },
    progress: { label: "In Progress", bg: "#f0fdf4", color: "#16a34a" },
    resolved: { label: "Resolved",    bg: "#f3f4f6", color: "#6b7280" },
    closed:   { label: "Closed",      bg: "#faf5ff", color: "#7c3aed" },
};

const kanbanColumns = [
    { key: "open",     label: "Open",        color: "#2563eb", headerBg: "#eff6ff", count: 87  },
    { key: "progress", label: "In Progress", color: "#16a34a", headerBg: "#f0fdf4", count: 34  },
    { key: "resolved", label: "Resolved",    color: "#6b7280", headerBg: "#f3f4f6", count: 127 },
    { key: "closed",   label: "Closed",      color: "#7c3aed", headerBg: "#faf5ff", count: 34  },
];

const priorityDist = [
    { label: "Critical", count: 2,  pct: 20, color: "#dc2626" },
    { label: "High",     count: 12, pct: 48, color: "#ea580c" },
    { label: "Medium",   count: 18, pct: 72, color: "#d97706" },
    { label: "Low",      count: 7,  pct: 28, color: "#16a34a" },
];

const slaItems = [
    { label: "Within SLA", count: 203, color: "#16a34a" },
    { label: "At Risk",    count: 28,  color: "#d97706" },
    { label: "Breached",   count: 17,  color: "#dc2626" },
];

const quickActions = [
    { icon: <FiPlus />,     label: "New Ticket"    },
    { icon: <FiUserPlus />, label: "Bulk Assign"   },
    { icon: <FiDownload />, label: "Export Report" },
    { icon: <FiSettings />, label: "SLA Settings"  },
];

// ─── Kanban Card ──────────────────────────────────────────────────────────────

function KanbanCard({ ticket, onClick }) {
    const p = priorityConfig[ticket.priority];
    return (
        <div className="kb-card" onClick={onClick}>
            <div className="kb-card-top">
                <span className="kb-ticket-id">{ticket.id}</span>
                <span className="kb-priority-badge" style={{ background: p.bg, color: p.color }}>
                    <span className="kb-priority-dot" style={{ background: p.dot }} />
                    {p.label}
                </span>
            </div>
            <p className="kb-subject">{ticket.subject}</p>
            <div className="kb-card-footer">
                <div className="kb-assignee">
                    <div className="kb-avatar">
                        {ticket.assigned === "Unassigned"
                            ? "?"
                            : ticket.assigned.split(" ").map(w => w[0]).join("")}
                    </div>
                    <span className="kb-assignee-name">{ticket.assigned}</span>
                </div>
                <span className="kb-date">{ticket.date.replace(", 2023", "")}</span>
            </div>
        </div>
    );
}

// ─── Tickets List Page ─────────────────────────────────────────────────────────

function Tickets() {
    const navigate = useNavigate();
    const [view, setView] = useState("table");
    const [activeFilter, setActiveFilter] = useState("all");

    const filteredTickets = activeFilter === "all"
        ? tickets
        : tickets.filter(t => t.status === activeFilter);

    return (
        <div className="tl-page">

            {/* ── Header ── */}
            <div className="tl-header">
                <div>
                    <h1 className="tl-title">Tickets</h1>
                    <p className="tl-subtitle">Manage and track all support tickets</p>
                </div>
                <div className="tl-header-btns">
                    <button className="tl-btn-outline"><FiFilter size={14} /> Filter</button>
                    <button className="tl-btn-outline"><FiDownload size={14} /> Export</button>
                    <button className="tl-btn-primary"><FiPlus size={14} /> New Ticket</button>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="tl-stats">
                <div className="tl-stat-card">
                    <div className="tl-stat-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
                        <FiTag size={20} />
                    </div>
                    <div>
                        <p className="tl-stat-label">TOTAL TICKETS</p>
                        <p className="tl-stat-value">248</p>
                    </div>
                </div>
                <div className="tl-stat-card">
                    <div className="tl-stat-icon" style={{ background: "#fff7ed", color: "#ea580c" }}>
                        <FiAlertCircle size={20} />
                    </div>
                    <div>
                        <p className="tl-stat-label">OPEN</p>
                        <p className="tl-stat-value">87</p>
                    </div>
                </div>
                <div className="tl-stat-card">
                    <div className="tl-stat-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                        <FiClock size={20} />
                    </div>
                    <div>
                        <p className="tl-stat-label">IN PROGRESS</p>
                        <p className="tl-stat-value">34</p>
                    </div>
                </div>
                <div className="tl-stat-card">
                    <div className="tl-stat-icon" style={{ background: "#f3f4f6", color: "#6b7280" }}>
                        <FiCheckCircle size={20} />
                    </div>
                    <div>
                        <p className="tl-stat-label">RESOLVED</p>
                        <p className="tl-stat-value">127</p>
                    </div>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="tl-body">

                {/* ── Main ── */}
                <div className="tl-main">
                    <div className="tl-card">

                        {/* Toolbar */}
                        <div className="tl-table-top">
                            <div className="tl-pills">
                                {[
                                    { key: "all",      label: "All"         },
                                    { key: "open",     label: "Open"        },
                                    { key: "progress", label: "In Progress" },
                                    { key: "resolved", label: "Resolved"    },
                                    { key: "closed",   label: "Closed"      },
                                ].map(f => (
                                    <button
                                        key={f.key}
                                        className={`tl-pill ${activeFilter === f.key ? "tl-pill-active" : ""}`}
                                        onClick={() => setActiveFilter(f.key)}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>

                            <div className="tl-toolbar-right">
                                <div className="tl-search-wrap">
                                    <FiSearch size={14} className="tl-search-icon" />
                                    <input className="tl-search" placeholder="Search tickets..." />
                                </div>
                                <div className="tl-view-toggle">
                                    <button
                                        className={`tl-view-btn ${view === "table" ? "tl-view-btn-active" : ""}`}
                                        onClick={() => setView("table")}
                                        title="Table view"
                                    >
                                        <FiList size={20} />
                                    </button>
                                    <button
                                        className={`tl-view-btn ${view === "kanban" ? "tl-view-btn-active" : ""}`}
                                        onClick={() => setView("kanban")}
                                        title="Kanban view"
                                    >
                                        <FiColumns size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ── TABLE VIEW ── */}
                        {view === "table" && (
                            <>
                                <div className="tl-table-scroll">
                                    <table className="tl-table">
                                        <thead>
                                            <tr>
                                                <th>TICKET ID</th>
                                                <th>SUBJECT</th>
                                                <th>REQUESTER</th>
                                                <th>CATEGORY</th>
                                                <th>PRIORITY</th>
                                                <th>STATUS</th>
                                                <th>ASSIGNED TO</th>
                                                <th>DATE</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredTickets.map((tk) => {
                                                const p = priorityConfig[tk.priority];
                                                const s = statusConfig[tk.status];
                                                return (
                                                    <tr
                                                        key={tk.id}
                                                        className="tl-row-clickable"
                                                        onClick={() => navigate(`/tickets/${tk.id}`)}
                                                    >
                                                        <td className="tl-col-id">{tk.id}</td>
                                                        <td className="tl-col-subject">{tk.subject}</td>
                                                        <td className="tl-col-text">{tk.requester}</td>
                                                        <td className="tl-col-text">{tk.category}</td>
                                                        <td>
                                                            <span className="tl-priority-badge" style={{ background: p.bg, color: p.color }}>
                                                                <span className="tl-priority-dot" style={{ background: p.dot }} />
                                                                {p.label}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="tl-status-badge" style={{ background: s.bg, color: s.color }}>
                                                                {s.label}
                                                            </span>
                                                        </td>
                                                        <td className="tl-col-text">{tk.assigned}</td>
                                                        <td className="tl-col-date">{tk.date}</td>
                                                        <td>
                                                            <button
                                                                className="tl-more-btn"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <FiMoreVertical size={15} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="tl-pagination">
                                    <p className="tl-pag-info">Showing 1–10 of 248 tickets</p>
                                    <div className="tl-pag-controls">
                                        <button className="tl-pag-btn"><FiArrowLeft size={13} /></button>
                                        <button className="tl-pag-btn tl-pag-active">1</button>
                                        <button className="tl-pag-btn">2</button>
                                        <button className="tl-pag-btn">3</button>
                                        <button className="tl-pag-btn">...</button>
                                        <button className="tl-pag-btn">25</button>
                                        <button className="tl-pag-btn"><FiArrowRight size={13} /></button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ── KANBAN VIEW ── */}
                        {view === "kanban" && (
                            <div className="kb-board">
                                {kanbanColumns.map(col => {
                                    const colTickets = tickets.filter(t => t.status === col.key);
                                    return (
                                        <div key={col.key} className="kb-column">
                                            <div className="kb-col-header" style={{ borderTopColor: col.color }}>
                                                <div className="kb-col-title">
                                                    <span className="kb-col-dot" style={{ background: col.color }} />
                                                    <span className="kb-col-label">{col.label}</span>
                                                </div>
                                                <span className="kb-col-count" style={{ background: col.headerBg, color: col.color }}>
                                                    {col.count}
                                                </span>
                                            </div>
                                            <div className="kb-col-body">
                                                {colTickets.map(tk => (
                                                    <KanbanCard
                                                        key={tk.id}
                                                        ticket={tk}
                                                        onClick={() => navigate(`/tickets/${tk.id}`)}
                                                    />
                                                ))}
                                                <button className="kb-add-btn">
                                                    <FiPlus size={13} /> Add Ticket
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                    </div>
                </div>

                {/* ── Sidebar ── */}
                <aside className="tl-sidebar">

                    {/* Quick Actions */}
                    <div className="tl-card">
                        <p className="tl-sidebar-title">QUICK ACTIONS</p>
                        <div className="tl-qa-grid">
                            {quickActions.map((qa, i) => (
                                <button key={i} className="tl-qa-tile">
                                    <span className="tl-qa-icon">{qa.icon}</span>
                                    {qa.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Priority Distribution */}
                    <div className="tl-card">
                        <div className="tl-sidebar-title-row">
                            <p className="tl-sidebar-title">PRIORITY DISTRIBUTION</p>
                            <FiBarChart2 size={15} className="tl-sidebar-icon" />
                        </div>
                        <div className="tl-dist-list">
                            {priorityDist.map((d, i) => (
                                <div key={i} className="tl-dist-item">
                                    <div className="tl-dist-row">
                                        <span className="tl-dist-label">{d.label}</span>
                                        <span className="tl-dist-count">{d.count}</span>
                                    </div>
                                    <div className="tl-dist-track">
                                        <div className="tl-dist-fill" style={{ width: `${d.pct}%`, background: d.color }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SLA Status */}
                    <div className="tl-card">
                        <div className="tl-sidebar-title-row">
                            <p className="tl-sidebar-title">SLA STATUS</p>
                            <FiUsers size={15} className="tl-sidebar-icon" />
                        </div>
                        <div className="tl-sla-list">
                            {slaItems.map((s, i) => (
                                <div key={i} className="tl-sla-item">
                                    <div className="tl-sla-dot" style={{ background: s.color }} />
                                    <span className="tl-sla-label">{s.label}</span>
                                    <span className="tl-sla-count" style={{ color: s.color }}>{s.count}</span>
                                </div>
                            ))}
                        </div>
                        <div className="tl-sla-bar">
                            <div className="tl-sla-seg" style={{ width: "82%", background: "#16a34a" }} />
                            <div className="tl-sla-seg" style={{ width: "11%", background: "#d97706" }} />
                            <div className="tl-sla-seg" style={{ width: "7%",  background: "#dc2626" }} />
                        </div>
                        <p className="tl-sla-note">82% tickets within SLA target</p>
                    </div>

                </aside>

            </div>

        </div>
    );
}

export default Tickets;
