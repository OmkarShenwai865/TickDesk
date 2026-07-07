import { useState, useEffect } from "react";
import api from "../../services/api";
import "./Users.css";
import {
    FiUsers,
    FiUserCheck,
    FiHeadphones,
    FiShield,
    FiFilter,
    FiDownload,
    FiPlus,
    FiSearch,
    FiMoreVertical,
    FiX,
    FiUserPlus,
    FiUpload,
    FiMonitor,
    FiEdit2,
    FiSmartphone,
    FiHardDrive,
    FiChevronLeft,
    FiChevronRight,
    FiEye,
    FiEyeOff,
} from "react-icons/fi";

// ─── Constants ────────────────────────────────────────────────────────────────

const C = 2 * Math.PI * 50;

const TABS = [
    { key: "all",   label: "All Users",      role: ""         },
    { key: "emp",   label: "Employees",      role: "employee" },
    { key: "agent", label: "Support Agents", role: "agent"    },
    { key: "admin", label: "Admins",         role: "admin"    },
];

const STAT_META = [
    { Icon: FiUsers,      label: "TOTAL USERS",    key: "total_users",   color: "#2563eb", bg: "#eff6ff" },
    { Icon: FiUserCheck,  label: "ACTIVE USERS",   key: "active_users",  color: "#16a34a", bg: "#f0fdf4" },
    { Icon: FiHeadphones, label: "SUPPORT AGENTS", key: "support_agents",color: "#ea580c", bg: "#fff7ed" },
    { Icon: FiShield,     label: "ADMINISTRATORS", key: "administrators",color: "#7c3aed", bg: "#faf5ff" },
];

const roleConfig = {
    employee: { bg: "#eff6ff", color: "#2563eb", label: "Employee"      },
    agent:    { bg: "#fff7ed", color: "#ea580c", label: "Support Agent" },
    admin:    { bg: "#fef2f2", color: "#dc2626", label: "Admin"         },
};

const statusConfig = {
    active:   { dot: "#16a34a", label: "Active"   },
    busy:     { dot: "#ea580c", label: "Busy"     },
    inactive: { dot: "#9ca3af", label: "Inactive" },
};

const ASSET_ICON_MAP = {
    laptop:  FiHardDrive,
    desktop: FiHardDrive,
    server:  FiHardDrive,
    monitor: FiMonitor,
};

const DEPT_COLORS = ["#2563eb", "#7c3aed", "#16a34a", "#f59e0b", "#ea580c", "#0891b2"];

const quickActions = [
    { Icon: FiUserPlus, label: "Invite User",  color: "#2563eb", bg: "#eff6ff" },
    { Icon: FiUpload,   label: "Import",       color: "#16a34a", bg: "#f0fdf4" },
    { Icon: FiMonitor,  label: "Assign Asset", color: "#7c3aed", bg: "#faf5ff" },
    { Icon: FiEdit2,    label: "Bulk Edit",    color: "#ea580c", bg: "#fff7ed" },
];

const onlineAvatars = [
    { initials: "AS", color: "#2563eb" },
    { initials: "NG", color: "#7c3aed" },
    { initials: "RM", color: "#16a34a" },
    { initials: "PN", color: "#d97706" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPageButtons(current, total) {
    const MAX = 5;
    if (total <= MAX) return Array.from({ length: total }, (_, i) => i + 1);
    const half = Math.floor(MAX / 2);
    let start = Math.max(1, current - half);
    let end   = start + MAX - 1;
    if (end > total) { end = total; start = Math.max(1, end - MAX + 1); }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

// ─── Small helper components ──────────────────────────────────────────────────

function RoleBadge({ role }) {
    const cfg = roleConfig[role] || { bg: "#f3f4f6", color: "#374151", label: role };
    return (
        <span className="usr-role-badge" style={{ background: cfg.bg, color: cfg.color }}>
            {cfg.label}
        </span>
    );
}

function StatusDot({ status }) {
    const cfg = statusConfig[status] || { dot: "#9ca3af", label: status };
    return (
        <span className="usr-status-cell">
            <span className="usr-status-dot" style={{ background: cfg.dot }} />
            {cfg.label}
        </span>
    );
}

// ─── User Detail Drawer ───────────────────────────────────────────────────────

function UserDrawer({ user, detail, loading, onClose }) {
    const isOpen = !!user;
    const assets = detail?.assigned_assets || [];

    return (
        <>
            <div
                className={`udr-overlay${isOpen ? " udr-overlay-show" : ""}`}
                onClick={onClose}
            />
            <div className={`udr-panel${isOpen ? " udr-open" : ""}`}>
                {user && (
                    <>
                        {/* Header */}
                        <div className="udr-header">
                            <span className="udr-header-title">User Details</span>
                            <button className="udr-close-btn" onClick={onClose}>
                                <FiX size={18} />
                            </button>
                        </div>

                        {/* Scrollable body */}
                        <div className="udr-body">

                            {/* Profile */}
                            <div className="udr-profile">
                                <div
                                    className="udr-avatar-lg"
                                    style={{
                                        background: `linear-gradient(135deg, ${user.avatar_color} 0%, ${user.avatar_color}99 100%)`,
                                    }}
                                >
                                    {user.initials}
                                </div>
                                <p className="udr-profile-name">{user.name}</p>
                                <p className="udr-profile-email">{user.email}</p>
                                <div className="udr-profile-badges">
                                    <RoleBadge role={user.role} />
                                    <span className="udr-status-badge">
                                        <span
                                            className="usr-status-dot"
                                            style={{ background: statusConfig[user.status]?.dot || "#9ca3af" }}
                                        />
                                        {statusConfig[user.status]?.label || user.status}
                                    </span>
                                </div>
                            </div>

                            {/* General Information */}
                            <div className="udr-section">
                                <p className="udr-section-title">GENERAL INFORMATION</p>
                                <div className="udr-info-grid">
                                    <div className="udr-info-item">
                                        <span className="udr-info-key">Department</span>
                                        <span className="udr-info-val">{user.department || "—"}</span>
                                    </div>
                                    <div className="udr-info-item">
                                        <span className="udr-info-key">Employee ID</span>
                                        <span className="udr-info-val">{user.emp_id}</span>
                                    </div>
                                    <div className="udr-info-item">
                                        <span className="udr-info-key">Reports To</span>
                                        <span className="udr-info-val">{user.reports_to || "—"}</span>
                                    </div>
                                    <div className="udr-info-item">
                                        <span className="udr-info-key">Location</span>
                                        <span className="udr-info-val">{user.location || "—"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Assigned Assets */}
                            <div className="udr-section">
                                <p className="udr-section-title">
                                    ASSIGNED ASSETS ({loading ? "…" : assets.length})
                                </p>
                                {loading ? (
                                    <p style={{ fontSize: "13px", color: "#9ca3af" }}>Loading…</p>
                                ) : assets.length === 0 ? (
                                    <p style={{ fontSize: "13px", color: "#9ca3af" }}>No assets assigned</p>
                                ) : (
                                    <div className="udr-assets-list">
                                        {assets.map((asset, i) => {
                                            const Icon = ASSET_ICON_MAP[asset.category] || FiSmartphone;
                                            return (
                                                <div key={i} className="udr-asset-row">
                                                    <div className="udr-asset-icon">
                                                        <Icon size={14} />
                                                    </div>
                                                    <div className="udr-asset-info">
                                                        <p className="udr-asset-name">{asset.asset_name}</p>
                                                        <p className="udr-asset-serial">{asset.asset_tag}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Recent Activity */}
                            <div className="udr-section">
                                <p className="udr-section-title">RECENT ACTIVITY</p>
                                <div className="udr-activity-list">
                                    <div className="udr-activity-item">
                                        <div className="udr-act-dot-col">
                                            <span className="udr-act-dot" />
                                        </div>
                                        <div className="udr-act-body">
                                            <p className="udr-act-text">Activity log not available</p>
                                            <p className="udr-act-time">—</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="udr-footer">
                            <button className="udr-btn-edit">Edit Profile</button>
                            <button className="udr-btn-deactivate">Deactivate</button>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

// ─── New User Modal ───────────────────────────────────────────────────────────

const EMPTY_USER = {
    first_name: "", last_name: "", email: "", password: "",
    role: "employee", status: "active", location: "", department: "",
};

function NewUserModal({ onClose, onCreated }) {
    const [form,       setForm]       = useState(EMPTY_USER);
    const [depts,      setDepts]      = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [errors,     setErrors]     = useState({});
    const [showPwd,    setShowPwd]    = useState(false);

    useEffect(() => {
        api.get("accounts/departments/?page_size=200")
            .then(r => setDepts(r.data.results ?? []))
            .catch(() => {});
    }, []);

    const handleChange = (e) => {
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));
        setErrors(ev => ({ ...ev, [e.target.name]: undefined }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = {};
        if (!form.first_name.trim()) errs.first_name = "Required";
        if (!form.email.trim())      errs.email      = "Required";
        if (!form.password.trim())   errs.password   = "Required";
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setSubmitting(true);
        try {
            const payload = {
                first_name: form.first_name.trim(),
                last_name:  form.last_name.trim(),
                email:      form.email.trim(),
                password:   form.password,
                role:       form.role,
                status:     form.status,
                location:   form.location.trim(),
            };
            if (form.department) payload.department = Number(form.department);
            await api.post("accounts/users/", payload);
            onCreated();
            onClose();
        } catch (err) {
            const data = err.response?.data;
            if (data && typeof data === "object") setErrors(data);
            else setErrors({ non_field: "Something went wrong. Please try again." });
        } finally {
            setSubmitting(false);
        }
    };

    const field = (name, label, required, placeholder, type = "text") => (
        <div className="num-field">
            <label className="num-label">
                {label}{required && <span className="num-required">*</span>}
            </label>
            <div className={`num-input-wrap${name === "password" ? " num-pwd-wrap" : ""}`}>
                <input
                    className={`num-input${errors[name] ? " num-input-err" : ""}`}
                    type={name === "password" ? (showPwd ? "text" : "password") : type}
                    name={name}
                    placeholder={placeholder}
                    value={form[name]}
                    onChange={handleChange}
                    autoComplete={name === "password" ? "new-password" : undefined}
                />
                {name === "password" && (
                    <button type="button" className="num-pwd-toggle" onClick={() => setShowPwd(v => !v)} title={showPwd ? "Hide password" : "Show password"}>
                        {showPwd ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                    </button>
                )}
            </div>
            {errors[name] && <span className="num-field-err">{errors[name]}</span>}
        </div>
    );

    return (
        <div className="num-overlay" onClick={onClose}>
            <div className="num-card" onClick={e => e.stopPropagation()}>

                <div className="num-header">
                    <h2 className="num-title">New User</h2>
                    <button className="num-close" onClick={onClose}><FiX size={16} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="num-body">
                        {errors.non_field && <p className="num-err-banner">{errors.non_field}</p>}

                        <div className="num-row-2">
                            {field("first_name", "First Name", true, "John")}
                            {field("last_name",  "Last Name",  false, "Doe")}
                        </div>

                        {field("email", "Email Address", true, "john.doe@company.com", "email")}
                        {field("password", "Password", true, "Min. 8 characters")}

                        <div className="num-row-2">
                            <div className="num-field">
                                <label className="num-label">Role<span className="num-required">*</span></label>
                                <select className="num-select" name="role" value={form.role} onChange={handleChange}>
                                    <option value="employee">Employee</option>
                                    <option value="agent">Support Agent</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="num-field">
                                <label className="num-label">Status</label>
                                <select className="num-select" name="status" value={form.status} onChange={handleChange}>
                                    <option value="active">Active</option>
                                    <option value="busy">Busy</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>

                        <div className="num-row-2">
                            <div className="num-field">
                                <label className="num-label">Department</label>
                                <select className="num-select" name="department" value={form.department} onChange={handleChange}>
                                    <option value="">No Department</option>
                                    {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            {field("location", "Location", false, "e.g. Mumbai Office")}
                        </div>
                    </div>

                    <div className="num-footer">
                        <button type="button" className="num-btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="num-btn-submit" disabled={submitting}>
                            <FiPlus size={14} />
                            {submitting ? "Creating…" : "Create User"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Users Page ───────────────────────────────────────────────────────────────

function Users() {
    const [activeTab,    setActiveTab]    = useState("all");
    const [search,       setSearch]       = useState("");
    const [page,         setPage]         = useState(1);

    const [stats,        setStats]        = useState(null);
    const [userList,     setUserList]     = useState([]);
    const [totalCount,   setTotalCount]   = useState(0);
    const [pageSize,     setPageSize]     = useState(10);
    const [deptDist,     setDeptDist]     = useState([]);
    const [roleBreakdown,setRoleBreakdown]= useState([]);

    const [selectedUser, setSelectedUser] = useState(null);
    const [drawerDetail, setDrawerDetail] = useState(null);
    const [loadingDrawer,setLoadingDrawer]= useState(false);
    const [showModal,    setShowModal]    = useState(false);

    // Load stats and sidebar data once
    useEffect(() => {
        api.get("accounts/users/stats/").then(r => setStats(r.data)).catch(() => {});
        api.get("accounts/users/dept-distribution/").then(r => setDeptDist(r.data)).catch(() => {});
        api.get("accounts/users/role-breakdown/").then(r => setRoleBreakdown(r.data)).catch(() => {});
    }, []);

    // Reset to page 1 when tab or search changes
    useEffect(() => { setPage(1); }, [activeTab, search]);

    // Load paginated user list
    useEffect(() => {
        const role   = TABS.find(t => t.key === activeTab)?.role || "";
        const params = { page };
        if (role)   params.role   = role;
        if (search) params.search = search;
        api.get("accounts/users/", { params }).then(r => {
            setUserList(r.data.results);
            setTotalCount(r.data.count);
            setPageSize(r.data.page_size);
        }).catch(() => {});
    }, [activeTab, search, page]);

    function refreshAll() {
        api.get("accounts/users/stats/").then(r => setStats(r.data)).catch(() => {});
        api.get("accounts/users/dept-distribution/").then(r => setDeptDist(r.data)).catch(() => {});
        api.get("accounts/users/role-breakdown/").then(r => setRoleBreakdown(r.data)).catch(() => {});
        const role   = TABS.find(t => t.key === activeTab)?.role || "";
        const params = { page: 1 };
        if (role)   params.role   = role;
        if (search) params.search = search;
        api.get("accounts/users/", { params }).then(r => {
            setUserList(r.data.results);
            setTotalCount(r.data.count);
            setPageSize(r.data.page_size);
            setPage(1);
        }).catch(() => {});
    }

    function openDrawer(user) {
        setSelectedUser(user);
        setDrawerDetail(null);
        setLoadingDrawer(true);
        api.get(`accounts/users/${user.id}/`)
            .then(r  => setDrawerDetail(r.data))
            .catch(() => {})
            .finally(() => setLoadingDrawer(false));
    }

    function closeDrawer() {
        setSelectedUser(null);
        setDrawerDetail(null);
    }

    // Build donut segments from live role breakdown
    let cumPct = 0;
    const donutSegments = roleBreakdown.map(rb => {
        const seg = { ...rb, offset: (cumPct / 100) * C };
        cumPct += rb.pct;
        return seg;
    });

    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const pageStart  = (page - 1) * pageSize + 1;
    const pageEnd    = Math.min(page * pageSize, totalCount);
    const pageButtons = getPageButtons(page, totalPages);

    return (
        <div className="usr-page">

            {showModal && (
                <NewUserModal
                    onClose={() => setShowModal(false)}
                    onCreated={refreshAll}
                />
            )}

            {/* ── Header ── */}
            <div className="usr-header">
                <div>
                    <h1 className="usr-title">Users</h1>
                    <p className="usr-subtitle">
                        Manage employees, support agents and administrators
                    </p>
                </div>
                <div className="usr-header-btns">
                    <button className="usr-btn-outline"><FiFilter size={13} /> Filter</button>
                    <button className="usr-btn-outline"><FiDownload size={13} /> Export</button>
                    <button className="usr-btn-primary" onClick={() => setShowModal(true)}>
                        <FiPlus size={13} /> New User
                    </button>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <section className="usr-stats">
                {STAT_META.map(({ Icon, label, key, color, bg }) => (
                    <div key={key} className="usr-stat-card">
                        <div className="usr-stat-icon" style={{ background: bg, color }}>
                            <Icon size={20} />
                        </div>
                        <div className="usr-stat-text">
                            <p className="usr-stat-label">{label}</p>
                            <p className="usr-stat-value">
                                {stats ? stats[key].toLocaleString() : "—"}
                            </p>
                            <div className="usr-trend usr-trend-neutral">
                                <span className="usr-trend-arrow">→</span>
                                <span className="usr-trend-pct">Live data</span>
                            </div>
                        </div>
                    </div>
                ))}
            </section>

            {/* ── Body ── */}
            <div className="usr-body">

                {/* ── Main column ── */}
                <div className="usr-main">
                    <div className="usr-card">

                        {/* Tabs + Search row */}
                        <div className="usr-toolbar">
                            <div className="usr-tabs">
                                {TABS.map(t => (
                                    <button
                                        key={t.key}
                                        className={`usr-tab${activeTab === t.key ? " usr-tab-active" : ""}`}
                                        onClick={() => setActiveTab(t.key)}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                            <div className="usr-search-wrap">
                                <FiSearch size={14} className="usr-search-icon" />
                                <input
                                    className="usr-search"
                                    placeholder="Search users..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Table */}
                        <div className="usr-table-scroll">
                            <table className="usr-table">
                                <thead>
                                    <tr>
                                        <th>NAME</th>
                                        <th>ID</th>
                                        <th>DEPARTMENT</th>
                                        <th>ROLE</th>
                                        <th>STATUS</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {userList.map(u => (
                                        <tr
                                            key={u.id}
                                            className="usr-row"
                                            onClick={() => openDrawer(u)}
                                        >
                                            <td>
                                                <div className="usr-name-cell">
                                                    <div
                                                        className="usr-avatar"
                                                        style={{ background: u.avatar_color }}
                                                    >
                                                        {u.initials}
                                                    </div>
                                                    <div>
                                                        <p className="usr-name">{u.name}</p>
                                                        <p className="usr-email">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="usr-col-id">{u.emp_id}</td>
                                            <td className="usr-col-dept">{u.department || "—"}</td>
                                            <td><RoleBadge role={u.role} /></td>
                                            <td><StatusDot status={u.status} /></td>
                                            <td>
                                                <button
                                                    className="usr-more-btn"
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    <FiMoreVertical size={15} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {userList.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                style={{ textAlign: "center", padding: "32px", color: "#9ca3af" }}
                                            >
                                                No users found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="usr-pagination">
                            <span className="usr-pag-info">
                                {totalCount > 0
                                    ? `Showing ${pageStart}–${pageEnd} of ${totalCount.toLocaleString()} users`
                                    : "No users"}
                            </span>
                            <div className="usr-pag-controls">
                                <button
                                    className="usr-pag-btn"
                                    disabled={page <= 1}
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    <FiChevronLeft size={13} />
                                </button>
                                {pageButtons.map(pg => (
                                    <button
                                        key={pg}
                                        className={`usr-pag-btn${page === pg ? " usr-pag-active" : ""}`}
                                        onClick={() => setPage(pg)}
                                    >
                                        {pg}
                                    </button>
                                ))}
                                <button
                                    className="usr-pag-btn"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    <FiChevronRight size={13} />
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

                {/* ── Right Sidebar ── */}
                <aside className="usr-sidebar">

                    {/* Quick Actions */}
                    <div className="usr-card">
                        <p className="usr-sidebar-title">QUICK ACTIONS</p>
                        <div className="usr-qa-grid">
                            {quickActions.map(({ Icon, label, color, bg }) => (
                                <button key={label} className="usr-qa-tile">
                                    <span className="usr-qa-icon-wrap" style={{ background: bg }}>
                                        <Icon size={18} color={color} />
                                    </span>
                                    <span className="usr-qa-label">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Department Distribution */}
                    <div className="usr-card">
                        <p className="usr-sidebar-title">DEPARTMENT DISTRIBUTION</p>
                        <div className="usr-dist-list">
                            {deptDist.length === 0
                                ? <p style={{ fontSize: "13px", color: "#9ca3af" }}>No data</p>
                                : deptDist.map((d, i) => (
                                    <div key={d.label} className="usr-dist-item">
                                        <div className="usr-dist-row">
                                            <span className="usr-dist-label">{d.label}</span>
                                            <span className="usr-dist-pct">{d.pct}%</span>
                                        </div>
                                        <div className="usr-dist-track">
                                            <div
                                                className="usr-dist-fill"
                                                style={{
                                                    width: `${d.pct}%`,
                                                    background: DEPT_COLORS[i % DEPT_COLORS.length],
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>

                    {/* Online Now */}
                    <div className="usr-card">
                        <div className="usr-online-header">
                            <p className="usr-sidebar-title" style={{ marginBottom: 0 }}>
                                ONLINE NOW
                            </p>
                            <div className="usr-online-badge">
                                <span className="usr-online-green-dot" />
                                42 Online
                            </div>
                        </div>
                        <div className="usr-online-avatars">
                            {onlineAvatars.map((av, i) => (
                                <div
                                    key={i}
                                    className="usr-online-av"
                                    style={{
                                        background: av.color,
                                        zIndex: onlineAvatars.length - i,
                                        marginLeft: i === 0 ? 0 : "-10px",
                                    }}
                                >
                                    {av.initials}
                                </div>
                            ))}
                            <div className="usr-online-more" style={{ marginLeft: "-10px" }}>
                                +38
                            </div>
                        </div>
                    </div>

                    {/* Role Breakdown */}
                    <div className="usr-card">
                        <p className="usr-sidebar-title">ROLE BREAKDOWN</p>
                        <div className="usr-donut-wrap">
                            <svg width="140" height="140" viewBox="0 0 140 140">
                                <circle
                                    cx="70" cy="70" r="50"
                                    fill="none"
                                    stroke="#f1f5f9"
                                    strokeWidth="20"
                                />
                                {donutSegments.map((seg, i) => (
                                    <circle
                                        key={i}
                                        cx="70" cy="70" r="50"
                                        fill="none"
                                        stroke={seg.color}
                                        strokeWidth="20"
                                        strokeDasharray={`${(seg.pct / 100) * C} ${C}`}
                                        strokeDashoffset={-seg.offset}
                                        strokeLinecap="butt"
                                        transform="rotate(-90 70 70)"
                                    />
                                ))}
                                <text x="70" y="66" textAnchor="middle" className="usr-donut-val">
                                    {stats
                                        ? (stats.total_users > 999
                                            ? `${(stats.total_users / 1000).toFixed(1)}k`
                                            : stats.total_users)
                                        : "—"}
                                </text>
                                <text x="70" y="82" textAnchor="middle" className="usr-donut-sub">
                                    Users
                                </text>
                            </svg>
                        </div>
                        <div className="usr-donut-legend">
                            {donutSegments.map((seg, i) => (
                                <div key={i} className="usr-legend-item">
                                    <span
                                        className="usr-legend-dot"
                                        style={{ background: seg.color }}
                                    />
                                    <span className="usr-legend-label">{seg.label}</span>
                                    <span className="usr-legend-pct">{seg.pct}%</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </aside>

            </div>

            {/* ── User Detail Drawer ── */}
            <UserDrawer
                user={selectedUser}
                detail={drawerDetail}
                loading={loadingDrawer}
                onClose={closeDrawer}
            />

        </div>
    );
}

export default Users;
