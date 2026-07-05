import { useEffect, useState } from "react";
import api from "../../services/api";
import "./Assets.css";

import {
    FiMonitor,
    FiUser,
    FiCheckCircle,
    FiTool,
    FiPlus,
    FiFilter,
    FiDownload,
    FiChevronLeft,
    FiChevronRight,
    FiPrinter,
    FiSmartphone,
    FiCpu,
    FiMoreHorizontal,
    FiAlertTriangle,
    FiUploadCloud,
    FiTag,
} from "react-icons/fi";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const catIconMap = {
    Laptop:     { Icon: FiMonitor,    color: "#2563eb" },
    Monitor:    { Icon: FiMonitor,    color: "#7c3aed" },
    Printer:    { Icon: FiPrinter,    color: "#ea580c" },
    Mobile:     { Icon: FiSmartphone, color: "#16a34a" },
    Desktop:    { Icon: FiCpu,        color: "#0891b2" },
    Networking: { Icon: FiCpu,        color: "#06b6d4" },
    Server:     { Icon: FiCpu,        color: "#ef4444" },
    Other:      { Icon: FiCpu,        color: "#6b7280" },
};

function fmtDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
    });
}

// ─── Static sidebar data (no API yet) ─────────────────────────────────────────

const activities = [
    { dot: "#2563eb", title: 'MacBook Pro 14" (AST-2024-001)', action: "was assigned to",      target: "Alex Rivera",   sub: "Action performed by Administrator", time: "10 mins ago" },
    { dot: "#16a34a", title: "Dell Monitor (AST-2023-112)",    action: "was returned by",      target: "Finance Dept.", sub: "Asset marked as 'Available'",       time: "2 hours ago" },
    { dot: "#ea580c", title: "HP LaserJet Printer",            action: "reported a paper jam failure.", target: "",     sub: "Maintenance ticket #T-9923 created", time: "Yesterday"  },
];

const warrantyItems = [
    { name: "Precision Workstation", days: 3,  cls: "critical" },
    { name: "Cisco Router X2",       days: 8,  cls: "warning"  },
    { name: "Office Server Pro",     days: 14, cls: "safe"     },
];

const quickActions = [
    { Icon: FiUser,        label: "Assign Asset" },
    { Icon: FiPlus,        label: "New Entry"    },
    { Icon: FiUploadCloud, label: "Import CSV"   },
    { Icon: FiTag,         label: "Labels"       },
];

// ─── Small helpers ────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
    const key = status.toLowerCase().replace(/\s+/g, "-");
    return <span className={`ast-status ast-status-${key}`}>{status}</span>;
}

function CatIcon({ category }) {
    const { Icon, color } = catIconMap[category] || { Icon: FiCpu, color: "#6b7280" };
    return (
        <span className="cat-icon" style={{ color }}>
            <Icon size={14} />
        </span>
    );
}

// ─── Assets Page ─────────────────────────────────────────────────────────────

function Assets() {
    const [stats,        setStats]        = useState(null);
    const [assets,       setAssets]       = useState([]);
    const [totalCount,   setTotalCount]   = useState(0);
    const [page,         setPage]         = useState(1);
    const [distribution, setDistribution] = useState([]);
    const [loading,      setLoading]      = useState(true);

    const PAGE_SIZE = 10;
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    const loadAssets = async (pg = 1) => {
        try {
            const res = await api.get(`assets/?page=${pg}`);
            setAssets(res.data.results);
            setTotalCount(res.data.count);
        } catch (err) {
            console.error("Assets load error:", err);
        }
    };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [statsRes, distRes] = await Promise.all([
                    api.get("assets/stats/"),
                    api.get("assets/distribution/"),
                ]);
                setStats(statsRes.data);
                setDistribution(distRes.data);
            } catch (err) {
                console.error("Assets init error:", err);
            }
            await loadAssets(1);
            setLoading(false);
        };
        load();
    }, []);

    const handlePage = async (pg) => {
        if (pg < 1 || pg > totalPages) return;
        setPage(pg);
        await loadAssets(pg);
    };

    const statCards = [
        { Icon: FiMonitor,     label: "TOTAL ASSETS", value: stats?.total       ?? "—", color: "#2563eb", bg: "#eff6ff" },
        { Icon: FiUser,        label: "ASSIGNED",     value: stats?.assigned    ?? "—", color: "#7c3aed", bg: "#f5f3ff" },
        { Icon: FiCheckCircle, label: "AVAILABLE",    value: stats?.available   ?? "—", color: "#16a34a", bg: "#f0fdf4" },
        { Icon: FiTool,        label: "MAINTENANCE",  value: stats?.maintenance ?? "—", color: "#ea580c", bg: "#fff7ed" },
    ];

    const start = (page - 1) * PAGE_SIZE + 1;
    const end   = Math.min(page * PAGE_SIZE, totalCount);

    return (
        <div className="assets-page">

            {/* ── Header ── */}
            <div className="assets-header">
                <div>
                    <h1 className="assets-title">Assets</h1>
                    <p className="assets-subtitle">
                        Manage all organizational IT assets, assignments and inventory.
                    </p>
                </div>
                <div className="assets-header-btns">
                    <button className="btn-outline"><FiFilter size={13} /> Filter</button>
                    <button className="btn-outline"><FiDownload size={13} /> Export</button>
                    <button className="btn-primary"><FiPlus size={13} /> Add Asset</button>
                </div>
            </div>

            {/* ── Stat cards ── */}
            <section className="assets-stats">
                {statCards.map(({ Icon, label, value, color, bg }) => (
                    <div key={label} className="stat-card">
                        <div className="stat-icon-wrap" style={{ background: bg, color }}>
                            <Icon size={20} />
                        </div>
                        <div className="stat-text">
                            <p className="stat-label">{label}</p>
                            <p className="stat-value">{value}</p>
                        </div>
                    </div>
                ))}
            </section>

            {/* ── Body ── */}
            <div className="assets-body">

                {/* ── Main column ── */}
                <div className="assets-main">

                    {/* Asset Inventory */}
                    <div className="a-card">
                        <div className="inv-top">
                            <h2 className="a-card-title">Asset Inventory</h2>
                            <div className="inv-pills">
                                <span className="filter-pill">Category: All</span>
                                <span className="filter-pill">Status: All</span>
                            </div>
                        </div>

                        <div className="table-scroll">
                            <table className="asset-table">
                                <thead>
                                    <tr>
                                        <th>Asset ID</th>
                                        <th>Asset Name</th>
                                        <th>Category</th>
                                        <th>Assigned To</th>
                                        <th>Purchase Date</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} style={{ textAlign: "center", color: "#94a3b8", padding: "2rem" }}>
                                                Loading…
                                            </td>
                                        </tr>
                                    ) : assets.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} style={{ textAlign: "center", color: "#94a3b8", padding: "2rem" }}>
                                                No assets found
                                            </td>
                                        </tr>
                                    ) : assets.map(a => (
                                        <tr key={a.id}>
                                            <td className="col-id">{a.asset_tag}</td>
                                            <td className="col-name">
                                                <CatIcon category={a.category_display} />
                                                {a.asset_name}
                                            </td>
                                            <td>{a.category_display}</td>
                                            <td>{a.assigned_to_name ?? "—"}</td>
                                            <td className="col-date">{fmtDate(a.purchase_date)}</td>
                                            <td><StatusBadge status={a.status_display} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="pagination-row">
                            <span className="pag-info">
                                {totalCount === 0
                                    ? "No assets"
                                    : `Showing ${start}–${end} of ${totalCount} assets`}
                            </span>
                            <div className="pag-controls">
                                <button className="pag-btn" onClick={() => handlePage(page - 1)} disabled={page === 1}>
                                    <FiChevronLeft size={13} />
                                </button>
                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(pg => (
                                    <button
                                        key={pg}
                                        className={`pag-btn${page === pg ? " pag-active" : ""}`}
                                        onClick={() => handlePage(pg)}
                                    >
                                        {pg}
                                    </button>
                                ))}
                                <button className="pag-btn" onClick={() => handlePage(page + 1)} disabled={page === totalPages}>
                                    <FiChevronRight size={13} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="a-card">
                        <h2 className="a-card-title" style={{ marginBottom: "18px" }}>
                            Recent Asset Activity
                        </h2>
                        <div className="activity-list">
                            {activities.map((act, i) => (
                                <div key={i} className="activity-item">
                                    <div className="act-dot-col">
                                        <span className="act-dot" style={{ background: act.dot }} />
                                        {i < activities.length - 1 && <span className="act-line" />}
                                    </div>
                                    <div className="act-body">
                                        <p className="act-text">
                                            <strong>{act.title}</strong>{" "}
                                            {act.action}{" "}
                                            {act.target && <strong>{act.target}</strong>}
                                        </p>
                                        <p className="act-sub">{act.sub}</p>
                                    </div>
                                    <span className="act-time">{act.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* ── Right Sidebar ── */}
                <aside className="assets-sidebar">

                    {/* Quick Actions */}
                    <div className="a-card">
                        <h2 className="a-card-title sidebar-section-title">QUICK ACTIONS</h2>
                        <div className="qa-grid">
                            {quickActions.map(({ Icon, label }) => (
                                <button key={label} className="qa-tile">
                                    <Icon className="qa-tile-icon" size={20} />
                                    <span>{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Asset Distribution */}
                    <div className="a-card">
                        <div className="dist-top">
                            <h2 className="a-card-title sidebar-section-title">ASSET DISTRIBUTION</h2>
                            <button className="icon-more"><FiMoreHorizontal size={16} /></button>
                        </div>
                        <div className="dist-list">
                            {distribution.length === 0 ? (
                                <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>No data yet</p>
                            ) : distribution.map(d => (
                                <div key={d.label} className="dist-item">
                                    <div className="dist-row">
                                        <span className="dist-label">{d.label}</span>
                                        <span className="dist-count">{d.count}</span>
                                    </div>
                                    <div className="dist-track">
                                        <div
                                            className="dist-fill"
                                            style={{ width: `${d.pct}%`, background: d.color }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Warranty Expiry */}
                    <div className="a-card warranty-card">
                        <div className="warranty-top">
                            <FiAlertTriangle className="warranty-alert-icon" size={16} />
                            <h2 className="warranty-heading">WARRANTY EXPIRY</h2>
                        </div>
                        <p className="warranty-desc">
                            12 high-value assets are expiring within the next 30 days.
                            Action recommended.
                        </p>
                        <div className="warranty-list">
                            {warrantyItems.map(w => (
                                <div key={w.name} className="warranty-item">
                                    <span className="warranty-name">{w.name}</span>
                                    <span className={`warranty-days days-${w.cls}`}>{w.days} Days</span>
                                </div>
                            ))}
                        </div>
                        <button className="warranty-btn">Manage Warranty Extensions</button>
                    </div>

                </aside>

            </div>

            {/* ── Footer ── */}
            <footer className="assets-footer">
                <span>© 2024 TickDesk v2.4.0. All rights reserved.</span>
                <div className="footer-links">
                    <a href="#">Terms of Service</a>
                    <a href="#">Privacy Policy</a>
                    <a href="#">Help Center</a>
                </div>
            </footer>

        </div>
    );
}

export default Assets;
