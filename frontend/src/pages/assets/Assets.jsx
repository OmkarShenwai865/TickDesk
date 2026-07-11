import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
    FiX,
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

// ─── Add Asset Modal ──────────────────────────────────────────────────────────

const EMPTY_FORM = {
    asset_name: "", category: "",
    status: "available", assigned_to: "", department: "", purchase_date: "",
};

function AddAssetModal({ onClose, onSuccess, defaultDepartment = "" }) {
    const [form,   setForm]   = useState({ ...EMPTY_FORM, department: defaultDepartment ? String(defaultDepartment) : "" });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [users,  setUsers]  = useState([]);
    const [depts,  setDepts]  = useState([]);

    useEffect(() => {
        api.get("accounts/users/?page_size=200").then(r => setUsers(r.data.results)).catch(() => {});
        api.get("accounts/departments/?page_size=200").then(r => setDepts(r.data.results)).catch(() => {});
    }, []);

    useEffect(() => {
        if (!defaultDepartment) return;
        setForm(f => ({ ...f, department: String(defaultDepartment) }));
    }, [defaultDepartment]);

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const validate = () => {
        const e = {};
        if (!form.asset_name.trim()) e.asset_name = "Asset name is required";
        if (!form.category)          e.category   = "Category is required";
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setSaving(true);
        try {
            const payload = {
                asset_name: form.asset_name.trim(),
                category:   form.category,
                status:     form.status,
                ...(form.assigned_to   && { assigned_to: parseInt(form.assigned_to) }),
                ...(form.department    && { department:  parseInt(form.department)  }),
                ...(form.purchase_date && { purchase_date: form.purchase_date       }),
            };
            await api.post("assets/", payload);
            onSuccess();
        } catch (err) {
            const data = err.response?.data || {};
            const mapped = {};
            for (const [k, v] of Object.entries(data)) {
                mapped[k] = Array.isArray(v) ? v[0] : String(v);
            }
            setErrors(mapped);
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <div className="ast-modal-overlay" onClick={onClose} />
            <div className="ast-modal">
                {/* Header */}
                <div className="ast-modal-header">
                    <div>
                        <h2 className="ast-modal-title">Add New Asset</h2>
                        <p className="ast-modal-sub">Register a new IT asset in your inventory</p>
                    </div>
                    <button className="ast-modal-close" onClick={onClose}>
                        <FiX size={17} />
                    </button>
                </div>

                {/* Form */}
                <form className="ast-modal-body" onSubmit={handleSubmit}>

                    {/* Asset Name */}
                    <div className="ast-form-row">
                        <label>Asset Name <span className="ast-req">*</span></label>
                        <input
                            className={`ast-input${errors.asset_name ? " ast-input-err" : ""}`}
                            value={form.asset_name}
                            onChange={e => set("asset_name", e.target.value)}
                            placeholder='e.g. MacBook Pro 14"'
                        />
                        {errors.asset_name && <span className="ast-err-msg">{errors.asset_name}</span>}
                    </div>

                    {/* Category + Status */}
                    <div className="ast-form-2col">
                        <div className="ast-form-row">
                            <label>Category <span className="ast-req">*</span></label>
                            <select
                                className={`ast-select${errors.category ? " ast-input-err" : ""}`}
                                value={form.category}
                                onChange={e => set("category", e.target.value)}
                            >
                                <option value="">Select category…</option>
                                <option value="laptop">Laptop</option>
                                <option value="desktop">Desktop</option>
                                <option value="monitor">Monitor</option>
                                <option value="printer">Printer</option>
                                <option value="networking">Networking</option>
                                <option value="server">Server</option>
                                <option value="other">Other</option>
                            </select>
                            {errors.category && <span className="ast-err-msg">{errors.category}</span>}
                        </div>
                        <div className="ast-form-row">
                            <label>Status</label>
                            <select
                                className="ast-select"
                                value={form.status}
                                onChange={e => set("status", e.target.value)}
                            >
                                <option value="available">Available</option>
                                <option value="assigned">Assigned</option>
                                <option value="maintenance">Maintenance</option>
                                <option value="retired">Retired</option>
                            </select>
                        </div>
                    </div>

                    {/* Assigned To + Department */}
                    <div className="ast-form-2col">
                        <div className="ast-form-row">
                            <label>Assigned To</label>
                            <select
                                className="ast-select"
                                value={form.assigned_to}
                                onChange={e => {
                                    set("assigned_to", e.target.value);
                                    if (e.target.value) set("status", "assigned");
                                }}
                            >
                                <option value="">Unassigned</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="ast-form-row">
                            <label>Department</label>
                            <select
                                className="ast-select"
                                value={form.department}
                                onChange={e => set("department", e.target.value)}
                            >
                                <option value="">No department</option>
                                {depts.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Purchase Date */}
                    <div className="ast-form-row">
                        <label>Purchase Date</label>
                        <input
                            type="date"
                            className="ast-input"
                            value={form.purchase_date}
                            onChange={e => set("purchase_date", e.target.value)}
                        />
                    </div>

                    {/* Server error */}
                    {errors.non_field_errors && (
                        <p className="ast-err-msg">{errors.non_field_errors}</p>
                    )}
                    {errors.detail && (
                        <p className="ast-err-msg">{errors.detail}</p>
                    )}

                    {/* Footer */}
                    <div className="ast-modal-footer">
                        <button type="button" className="ast-btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? "Adding…" : "Add Asset"}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

// ─── Assets Page ─────────────────────────────────────────────────────────────

function Assets() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const role = localStorage.getItem("role") || "employee";
    const isAdmin = role === "admin";
    const myUserId = parseInt(localStorage.getItem("user_id") || "0");
    const [stats,        setStats]        = useState(null);
    const [assets,       setAssets]       = useState([]);
    const [totalCount,   setTotalCount]   = useState(0);
    const [page,         setPage]         = useState(1);
    const [distribution, setDistribution] = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [showModal,    setShowModal]    = useState(false);
    const isEmployee = role === "employee";
    const [myAssets,     setMyAssets]     = useState(isEmployee || searchParams.get("my_assets") === "1");
    const [activities,   setActivities]   = useState([]);

    const PAGE_SIZE = 10;
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    const departmentFilter = searchParams.get("department") || "";
    const departmentName = searchParams.get("departmentName") || "";
    const shouldOpenCreate = searchParams.get("create") === "1";

    const loadAssets = async (pg = 1, mine = myAssets) => {
        try {
            const params = { page: pg };
            if (departmentFilter) params.department = departmentFilter;
            if (mine) params.my_assets = '1';
            const res = await api.get("assets/", { params });
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
                const [statsRes, distRes, actRes] = await Promise.all([
                    api.get("assets/stats/"),
                    api.get("assets/distribution/"),
                    api.get("assets/activity/"),
                ]);
                setStats(statsRes.data);
                setDistribution(distRes.data);
                setActivities(actRes.data);
            } catch (err) {
                console.error("Assets init error:", err);
            }
            await loadAssets(1);
            setLoading(false);
        };
        load();
    }, [departmentFilter]);

    useEffect(() => {
        if (shouldOpenCreate && isAdmin) setShowModal(true);
    }, [shouldOpenCreate, isAdmin]);

    const handleMyAssetsToggle = () => {
        const next = !myAssets;
        setMyAssets(next);
        setPage(1);
        loadAssets(1, next);
    };

    const handlePage = async (pg) => {
        if (pg < 1 || pg > totalPages) return;
        setPage(pg);
        await loadAssets(pg);
    };

    const refreshAll = async () => {
        const [statsRes, distRes, actRes] = await Promise.all([
            api.get("assets/stats/"),
            api.get("assets/distribution/"),
            api.get("assets/activity/"),
        ]);
        setStats(statsRes.data);
        setDistribution(distRes.data);
        setActivities(actRes.data);
        await loadAssets(1);
        setPage(1);
    };

    const statCards = [
        { Icon: FiMonitor,     label: "TOTAL ASSETS", value: stats?.total       ?? "—", color: "#2563eb", bg: "#eff6ff" },
        { Icon: FiUser,        label: "ASSIGNED",     value: stats?.assigned    ?? "—", color: "#7c3aed", bg: "#f5f3ff" },
        { Icon: FiCheckCircle, label: "AVAILABLE",    value: stats?.available   ?? "—", color: "#16a34a", bg: "#f0fdf4" },
        { Icon: FiTool,        label: "MAINTENANCE",  value: stats?.maintenance ?? "—", color: "#ea580c", bg: "#fff7ed" },
    ];

    const start = (page - 1) * PAGE_SIZE + 1;
    const end   = Math.min(page * PAGE_SIZE, totalCount);
    const inventoryPills = useMemo(() => ([
        departmentName ? `Department: ${departmentName}` : "Department: All",
        "Category: All",
        "Status: All",
    ]), [departmentName]);

    return (
        <div className="assets-page">

            {/* ── Header ── */}
            <div className="assets-header">
                <div>
                    <h1 className="assets-title">Assets</h1>
                    <p className="assets-subtitle">
                        {departmentName
                            ? `Manage IT assets assigned to ${departmentName}.`
                            : "Manage all organizational IT assets, assignments and inventory."}
                    </p>
                </div>
                <div className="assets-header-btns">
                    <button className="btn-outline"><FiFilter size={13} /> Filter</button>
                    {isAdmin && <button className="btn-outline"><FiDownload size={13} /> Export</button>}
                    {isAdmin && (
                        <button className="btn-primary" onClick={() => setShowModal(true)}>
                            <FiPlus size={13} /> Add Asset
                        </button>
                    )}
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
                            <div className="inv-pills-row">
                                {!isEmployee && (
                                <div className="ast-my-assets-wrap" onClick={handleMyAssetsToggle}>
                                    <div className={`tl-toggle-track ${myAssets ? "on" : ""}`}>
                                        <div className="tl-toggle-thumb" />
                                    </div>
                                    <span className="ast-my-assets-label">My Assets</span>
                                </div>
                                )}
                                {inventoryPills.map((pill) => (
                                    <span key={pill} className="filter-pill">{pill}</span>
                                ))}
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
                                        <tr
                                            key={a.id}
                                            className="asset-row-clickable"
                                            onClick={() => navigate(`/assets/${a.id}`)}
                                        >
                                            <td className="col-id">{a.asset_tag}</td>
                                            <td className="col-name">
                                                <CatIcon category={a.category_display} />
                                                {a.asset_name}
                                            </td>
                                            <td>{a.category_display}</td>
                                            <td>
                                                {a.assigned_to_name ?? "—"}
                                                {!isAdmin && a.assigned_to === myUserId && (
                                                    <span style={{
                                                        marginLeft: "6px",
                                                        fontSize: "10px",
                                                        fontWeight: 600,
                                                        background: "#eff6ff",
                                                        color: "#2563eb",
                                                        padding: "2px 6px",
                                                        borderRadius: "4px",
                                                        verticalAlign: "middle",
                                                    }}>You</span>
                                                )}
                                            </td>
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
                            {activities.length === 0 ? (
                                <p style={{ color: "#94a3b8", fontSize: "13px" }}>No activity yet</p>
                            ) : activities.map((act, i) => (
                                <div key={act.id} className="activity-item">
                                    <div className="act-dot-col">
                                        <span className="act-dot" style={{ background: "#2563eb" }} />
                                        {i < activities.length - 1 && <span className="act-line" />}
                                    </div>
                                    <div className="act-body">
                                        <p className="act-text">{act.action}</p>
                                        {act.actor && (
                                            <p className="act-sub">Action performed by {act.actor}</p>
                                        )}
                                    </div>
                                    <span className="act-time">{act.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* ── Right Sidebar ── */}
                <aside className="assets-sidebar">

                    {/* Quick Actions — admin only */}
                    {isAdmin && (
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
                    )}

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

            {/* ── Add Asset Modal ── */}
            {showModal && (
                <AddAssetModal
                    defaultDepartment={departmentFilter}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        setShowModal(false);
                        refreshAll();
                    }}
                />
            )}

        </div>
    );
}

export default Assets;
