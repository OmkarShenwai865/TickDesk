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

// ─── Static data ──────────────────────────────────────────────────────────────

const assetStats = [
    { Icon: FiMonitor,     label: "TOTAL ASSETS", value: "1,248", color: "#2563eb", bg: "#eff6ff" },
    { Icon: FiUser,        label: "ASSIGNED",     value: "986",   color: "#7c3aed", bg: "#f5f3ff" },
    { Icon: FiCheckCircle, label: "AVAILABLE",    value: "212",   color: "#16a34a", bg: "#f0fdf4" },
    { Icon: FiTool,        label: "MAINTENANCE",  value: "50",    color: "#ea580c", bg: "#fff7ed" },
];

const catIconMap = {
    Laptop:     { Icon: FiMonitor,    color: "#2563eb" },
    Monitor:    { Icon: FiMonitor,    color: "#7c3aed" },
    Printer:    { Icon: FiPrinter,    color: "#ea580c" },
    Mobile:     { Icon: FiSmartphone, color: "#16a34a" },
    Desktop:    { Icon: FiCpu,        color: "#0891b2" },
    Peripheral: { Icon: FiCpu,        color: "#6b7280" },
};

const assets = [
    { id: "AST-2024-001", name: 'MacBook Pro M3 14"',   category: "Laptop",     assignedTo: "Alex Rivera",     purchaseDate: "Mar 12, 2024", status: "Assigned"    },
    { id: "AST-2024-045", name: 'Dell UltraSharp 27"',  category: "Monitor",    assignedTo: "—",               purchaseDate: "Feb 05, 2024", status: "Available"   },
    { id: "AST-2023-992", name: "HP LaserJet Pro",       category: "Printer",    assignedTo: "Marketing Dept.", purchaseDate: "Nov 20, 2023", status: "Assigned"    },
    { id: "AST-2024-012", name: "iPhone 15 Pro",         category: "Mobile",     assignedTo: "Sarah Johnson",   purchaseDate: "Jan 08, 2024", status: "Assigned"    },
    { id: "AST-2023-876", name: "Dell OptiPlex 7090",    category: "Desktop",    assignedTo: "IT Dept.",        purchaseDate: "Sep 14, 2023", status: "Assigned"    },
    { id: "AST-2024-033", name: "Logitech MX Master 3",  category: "Peripheral", assignedTo: "—",              purchaseDate: "Feb 22, 2024", status: "Available"   },
    { id: "AST-2023-441", name: 'Samsung 27" Monitor',   category: "Monitor",    assignedTo: "James Wilson",    purchaseDate: "Jul 30, 2023", status: "Maintenance" },
    { id: "AST-2022-654", name: "ThinkPad X1 Carbon",    category: "Laptop",     assignedTo: "—",              purchaseDate: "Dec 10, 2022", status: "Retired"     },
    { id: "AST-2024-078", name: "Cisco Catalyst Switch",  category: "Peripheral", assignedTo: "Server Room",   purchaseDate: "Mar 01, 2024", status: "Assigned"    },
    { id: "AST-2023-320", name: "Canon imageCLASS",       category: "Printer",    assignedTo: "Finance Dept.", purchaseDate: "May 18, 2023", status: "Maintenance" },
];

const activities = [
    {
        dot: "#2563eb",
        title: "MacBook Pro 14” (AST-2024-001)",
        action: "was assigned to",
        target: "Alex Rivera",
        period: false,
        sub: "Action performed by Administrator",
        time: "10 mins ago",
    },
    {
        dot: "#16a34a",
        title: "Dell Monitor (AST-2023-112)",
        action: "was returned by",
        target: "Finance Dept.",
        period: false,
        sub: "Asset marked as ‘Available’",
        time: "2 hours ago",
    },
    {
        dot: "#ea580c",
        title: "HP LaserJet Printer",
        action: "reported a paper jam failure.",
        target: "",
        period: false,
        sub: "Maintenance ticket #T-9923 created",
        time: "Yesterday",
    },
];

const distribution = [
    { label: "Laptops",  count: 620, pct: 49.7, color: "#2563eb" },
    { label: "Desktops", count: 320, pct: 25.6, color: "#16a34a" },
    { label: "Monitors", count: 180, pct: 14.4, color: "#9ca3af" },
    { label: "Printers", count: 85,  pct: 6.8,  color: "#d1d5db" },
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
    const key = status.toLowerCase().replace(" ", "-");
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
                {assetStats.map(({ Icon, label, value, color, bg }) => (
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
                                    {assets.map(a => (
                                        <tr key={a.id}>
                                            <td className="col-id">{a.id}</td>
                                            <td className="col-name">
                                                <CatIcon category={a.category} />
                                                {a.name}
                                            </td>
                                            <td>{a.category}</td>
                                            <td>{a.assignedTo}</td>
                                            <td className="col-date">{a.purchaseDate}</td>
                                            <td><StatusBadge status={a.status} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="pagination-row">
                            <span className="pag-info">Showing 1–10 of 1,248 assets</span>
                            <div className="pag-controls">
                                <button className="pag-btn"><FiChevronLeft size={13} /></button>
                                <button className="pag-btn pag-active">1</button>
                                <button className="pag-btn">2</button>
                                <button className="pag-btn">3</button>
                                <button className="pag-btn"><FiChevronRight size={13} /></button>
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
                                            {act.period ? "." : ""}
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
                            {distribution.map(d => (
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
