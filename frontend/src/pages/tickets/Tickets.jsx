import "./TicketList.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

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

// ─── Config maps (keyed by raw API values) ────────────────────────────────────

const priorityConfig = {
    critical: { label: "Critical", bg: "#fef2f2", color: "#dc2626", dot: "#dc2626" },
    high:     { label: "High",     bg: "#fff7ed", color: "#ea580c", dot: "#ea580c" },
    medium:   { label: "Medium",   bg: "#fffbeb", color: "#d97706", dot: "#d97706" },
    low:      { label: "Low",      bg: "#f0fdf4", color: "#16a34a", dot: "#16a34a" },
};

const statusConfig = {
    open:        { label: "Open",        bg: "#eff6ff", color: "#2563eb" },
    in_progress: { label: "In Progress", bg: "#f0fdf4", color: "#16a34a" },
    resolved:    { label: "Resolved",    bg: "#f3f4f6", color: "#6b7280" },
    closed:      { label: "Closed",      bg: "#faf5ff", color: "#7c3aed" },
};

const kanbanColumns = [
    { key: "open",        label: "Open",        color: "#2563eb", headerBg: "#eff6ff" },
    { key: "in_progress", label: "In Progress", color: "#16a34a", headerBg: "#f0fdf4" },
    { key: "resolved",    label: "Resolved",    color: "#6b7280", headerBg: "#f3f4f6" },
    { key: "closed",      label: "Closed",      color: "#7c3aed", headerBg: "#faf5ff" },
];

const statusFilters = [
    { key: "",            label: "All"         },
    { key: "open",        label: "Open"        },
    { key: "in_progress", label: "In Progress" },
    { key: "resolved",    label: "Resolved"    },
    { key: "closed",      label: "Closed"      },
];

const quickActions = [
    { icon: <FiPlus />,     label: "New Ticket"    },
    { icon: <FiUserPlus />, label: "Bulk Assign"   },
    { icon: <FiDownload />, label: "Export Report" },
    { icon: <FiSettings />, label: "SLA Settings"  },
];

const slaItems = [
    { label: "Within SLA", count: 203, color: "#16a34a" },
    { label: "At Risk",    count: 28,  color: "#d97706" },
    { label: "Breached",   count: 17,  color: "#dc2626" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
    });
}

// ─── Kanban Card ──────────────────────────────────────────────────────────────

function KanbanCard({ ticket, onClick }) {
    const p = priorityConfig[ticket.priority] ?? priorityConfig.medium;
    const assignee = ticket.assigned_to_name ?? "Unassigned";
    return (
        <div className="kb-card" onClick={onClick}>
            <div className="kb-card-top">
                <span className="kb-ticket-id">{ticket.ticket_number}</span>
                <span className="kb-priority-badge" style={{ background: p.bg, color: p.color }}>
                    <span className="kb-priority-dot" style={{ background: p.dot }} />
                    {p.label}
                </span>
            </div>
            <p className="kb-subject">{ticket.title}</p>
            <div className="kb-card-footer">
                <div className="kb-assignee">
                    <div className="kb-avatar">
                        {assignee === "Unassigned"
                            ? "?"
                            : assignee.split(" ").map(w => w[0]).join("").slice(0, 2)}
                    </div>
                    <span className="kb-assignee-name">{assignee}</span>
                </div>
                <span className="kb-date">{fmtDate(ticket.created_at)}</span>
            </div>
        </div>
    );
}

// ─── Tickets Page ─────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

function Tickets() {
    const navigate = useNavigate();
    const [view,          setView]         = useState("table");
    const [activeFilter,  setActiveFilter] = useState("");
    const [search,        setSearch]       = useState("");

    const [stats,         setStats]        = useState(null);
    const [tickets,       setTickets]      = useState([]);
    const [totalCount,    setTotalCount]   = useState(0);
    const [page,          setPage]         = useState(1);
    const [priorityDist,  setPriorityDist] = useState([]);
    const [kanbanTickets, setKanbanTickets]= useState([]);

    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    const loadTickets = async (pg = 1, statusVal = activeFilter, q = search) => {
        try {
            const params = new URLSearchParams({ page: pg, page_size: PAGE_SIZE });
            if (statusVal) params.set('status', statusVal);
            if (q)         params.set('search', q);
            const res = await api.get(`tickets/?${params}`);
            setTickets(res.data.results);
            setTotalCount(res.data.count);
        } catch (err) {
            console.error("Tickets load error:", err);
        }
    };

    const loadKanban = async () => {
        try {
            const res = await api.get("tickets/?page_size=100");
            setKanbanTickets(res.data.results);
        } catch (err) {
            console.error("Kanban load error:", err);
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                const [statsRes, distRes] = await Promise.all([
                    api.get("tickets/stats/"),
                    api.get("tickets/priority-distribution/"),
                ]);
                setStats(statsRes.data);
                setPriorityDist(distRes.data);
            } catch (err) {
                console.error("Tickets init error:", err);
            }
            await loadTickets(1, "", "");
        };
        init();
    }, []);

    useEffect(() => {
        if (view === "kanban") loadKanban();
    }, [view]);

    const handleFilter = (key) => {
        setActiveFilter(key);
        setPage(1);
        loadTickets(1, key, search);
    };

    const handleSearch = (e) => {
        const q = e.target.value;
        setSearch(q);
        setPage(1);
        loadTickets(1, activeFilter, q);
    };

    const handlePage = (pg) => {
        if (pg < 1 || pg > totalPages) return;
        setPage(pg);
        loadTickets(pg, activeFilter, search);
    };

    const start = (page - 1) * PAGE_SIZE + 1;
    const end   = Math.min(page * PAGE_SIZE, totalCount);

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
                        <p className="tl-stat-value">{stats?.total ?? "—"}</p>
                    </div>
                </div>
                <div className="tl-stat-card">
                    <div className="tl-stat-icon" style={{ background: "#fff7ed", color: "#ea580c" }}>
                        <FiAlertCircle size={20} />
                    </div>
                    <div>
                        <p className="tl-stat-label">OPEN</p>
                        <p className="tl-stat-value">{stats?.open ?? "—"}</p>
                    </div>
                </div>
                <div className="tl-stat-card">
                    <div className="tl-stat-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                        <FiClock size={20} />
                    </div>
                    <div>
                        <p className="tl-stat-label">IN PROGRESS</p>
                        <p className="tl-stat-value">{stats?.in_progress ?? "—"}</p>
                    </div>
                </div>
                <div className="tl-stat-card">
                    <div className="tl-stat-icon" style={{ background: "#f3f4f6", color: "#6b7280" }}>
                        <FiCheckCircle size={20} />
                    </div>
                    <div>
                        <p className="tl-stat-label">RESOLVED</p>
                        <p className="tl-stat-value">{stats?.resolved ?? "—"}</p>
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
                                {statusFilters.map(f => (
                                    <button
                                        key={f.key}
                                        className={`tl-pill ${activeFilter === f.key ? "tl-pill-active" : ""}`}
                                        onClick={() => handleFilter(f.key)}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>

                            <div className="tl-toolbar-right">
                                <div className="tl-search-wrap">
                                    <FiSearch size={14} className="tl-search-icon" />
                                    <input
                                        className="tl-search"
                                        placeholder="Search tickets..."
                                        value={search}
                                        onChange={handleSearch}
                                    />
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
                                                <th>PRIORITY</th>
                                                <th>STATUS</th>
                                                <th>ASSIGNED TO</th>
                                                <th>DATE</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tickets.length === 0 ? (
                                                <tr>
                                                    <td colSpan={8} style={{ textAlign: "center", color: "#94a3b8", padding: "2rem" }}>
                                                        No tickets found
                                                    </td>
                                                </tr>
                                            ) : tickets.map((tk) => {
                                                const p = priorityConfig[tk.priority] ?? priorityConfig.medium;
                                                const s = statusConfig[tk.status]    ?? statusConfig.open;
                                                return (
                                                    <tr
                                                        key={tk.id}
                                                        className="tl-row-clickable"
                                                        onClick={() => navigate(`/tickets/${tk.id}`)}
                                                    >
                                                        <td className="tl-col-id">{tk.ticket_number}</td>
                                                        <td className="tl-col-subject">{tk.title}</td>
                                                        <td className="tl-col-text">{tk.created_by_name ?? "—"}</td>
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
                                                        <td className="tl-col-text">{tk.assigned_to_name ?? "Unassigned"}</td>
                                                        <td className="tl-col-date">{fmtDate(tk.created_at)}</td>
                                                        <td>
                                                            <button className="tl-more-btn" onClick={(e) => e.stopPropagation()}>
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
                                    <p className="tl-pag-info">
                                        {totalCount === 0
                                            ? "No tickets"
                                            : `Showing ${start}–${end} of ${totalCount} tickets`}
                                    </p>
                                    <div className="tl-pag-controls">
                                        <button className="tl-pag-btn" onClick={() => handlePage(page - 1)} disabled={page === 1}>
                                            <FiArrowLeft size={13} />
                                        </button>
                                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(pg => (
                                            <button
                                                key={pg}
                                                className={`tl-pag-btn${page === pg ? " tl-pag-active" : ""}`}
                                                onClick={() => handlePage(pg)}
                                            >
                                                {pg}
                                            </button>
                                        ))}
                                        <button className="tl-pag-btn" onClick={() => handlePage(page + 1)} disabled={page === totalPages}>
                                            <FiArrowRight size={13} />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ── KANBAN VIEW ── */}
                        {view === "kanban" && (
                            <div className="kb-board">
                                {kanbanColumns.map(col => {
                                    const colTickets = kanbanTickets.filter(t => t.status === col.key);
                                    const colCount   = stats?.[col.key === "in_progress" ? "in_progress" : col.key] ?? colTickets.length;
                                    return (
                                        <div key={col.key} className="kb-column">
                                            <div className="kb-col-header" style={{ borderTopColor: col.color }}>
                                                <div className="kb-col-title">
                                                    <span className="kb-col-dot" style={{ background: col.color }} />
                                                    <span className="kb-col-label">{col.label}</span>
                                                </div>
                                                <span className="kb-col-count" style={{ background: col.headerBg, color: col.color }}>
                                                    {colCount}
                                                </span>
                                            </div>
                                            <div className="kb-col-body">
                                                {colTickets.length === 0 ? (
                                                    <p style={{ color: "#94a3b8", fontSize: "0.8rem", textAlign: "center", padding: "1rem 0" }}>
                                                        No tickets
                                                    </p>
                                                ) : colTickets.map(tk => (
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
                            {priorityDist.length === 0 ? (
                                <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>No data yet</p>
                            ) : priorityDist.map((d, i) => (
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

                    {/* SLA Status (static — no backend data yet) */}
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
