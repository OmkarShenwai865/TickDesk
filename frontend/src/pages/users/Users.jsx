import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../services/api";
import Sparkline from "../../components/ui/Sparkline";
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
    FiCopy,
    FiCheckCircle,
} from "react-icons/fi";

// ─── Constants ────────────────────────────────────────────────────────────────

const C = 2 * Math.PI * 50;

const TABS = [
    { key: "all",   label: "All Users",      role: ""         },
    { key: "emp",   label: "Employees",      role: "employee" },
    { key: "agent", label: "Support Agents", role: "agent"    },
    { key: "admin", label: "Admins",         role: "admin"    },
    { key: "invited", label: "Invited Users", role: null      },
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
    { Icon: FiUpload,   label: "Bulk Invite",  color: "#16a34a", bg: "#f0fdf4" },
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

function InviteStatusBadge({ status }) {
    const map = {
        pending: { bg: "#fff7ed", color: "#ea580c", label: "Pending" },
        accepted: { bg: "#ecfdf5", color: "#059669", label: "Accepted" },
        expired: { bg: "#fef2f2", color: "#dc2626", label: "Expired" },
        cancelled: { bg: "#f3f4f6", color: "#6b7280", label: "Cancelled" },
    };
    const cfg = map[status] || { bg: "#f3f4f6", color: "#374151", label: status };
    return (
        <span className="usr-role-badge" style={{ background: cfg.bg, color: cfg.color }}>
            {cfg.label}
        </span>
    );
}

function LoginStateBadge({ hasLoggedIn }) {
    return (
        <span className="usr-role-badge" style={{
            background: hasLoggedIn ? "#ecfdf5" : "#eff6ff",
            color: hasLoggedIn ? "#059669" : "#2563eb",
        }}>
            {hasLoggedIn ? "Logged In" : "Not Yet"}
        </span>
    );
}

function fmtDateTime(value) {
    if (!value) return "—";
    try {
        return new Date(value).toLocaleString();
    } catch {
        return "—";
    }
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

const EMPTY_INVITE = {
    email: "", role: "employee", department: "", location: "",
};

const EMPTY_BULK_DEFAULTS = {
    role: "employee", department: "", location: "",
};

const BULK_TEMPLATE = [
    "email,role,department,location",
    "alex@company.com,employee,IT,Mumbai Office",
    "sam@company.com,agent,Support,Bengaluru",
].join("\n");

function parseCsvLine(line) {
    const cells = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === "," && !inQuotes) {
            cells.push(current.trim());
            current = "";
        } else {
            current += char;
        }
    }
    cells.push(current.trim());
    return cells;
}

function parseBulkRows(text) {
    const lines = text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);

    if (!lines.length) return [];

    const firstCells = parseCsvLine(lines[0]).map(cell => cell.trim().toLowerCase());
    const hasHeader = firstCells.includes("email");
    const dataLines = hasHeader ? lines.slice(1) : lines;
    const headers = hasHeader
        ? firstCells
        : ["email", "role", "department", "location"].slice(0, Math.max(firstCells.length, 1));

    return dataLines.map((line, index) => {
        const cells = parseCsvLine(line);
        const row = { _line: hasHeader ? index + 2 : index + 1 };
        headers.forEach((header, cellIndex) => {
            row[header] = (cells[cellIndex] || "").trim();
        });
        if (!hasHeader && headers.length === 1) row.email = row.email || cells[0] || "";
        return row;
    });
}

function InviteUserModal({ onClose }) {
    const [form, setForm] = useState(EMPTY_INVITE);
    const [depts, setDepts] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [invite, setInvite] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        api.get("accounts/departments/?page_size=200")
            .then(r => setDepts(r.data.results ?? []))
            .catch(() => {});
    }, []);

    const handleChange = (e) => {
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));
        setErrors(ev => ({ ...ev, [e.target.name]: undefined, non_field: undefined }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = {};
        if (!form.email.trim()) errs.email = "Required";
        if (!form.role) errs.role = "Required";
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setSubmitting(true);
        try {
            const payload = {
                email: form.email.trim(),
                role: form.role,
                location: form.location.trim(),
            };
            if (form.department) payload.department = Number(form.department);
            const res = await api.post("accounts/users/invite/", payload);
            setInvite(res.data);
        } catch (err) {
            const data = err.response?.data;
            if (data && typeof data === "object") setErrors(data);
            else setErrors({ non_field: "Something went wrong. Please try again." });
        } finally {
            setSubmitting(false);
        }
    };

    const copyInvite = async () => {
        if (!invite?.invite_url) return;
        try {
            await navigator.clipboard.writeText(invite.invite_url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            setErrors({ non_field: "Invite created. Copy the link manually from the field below." });
        }
    };

    return (
        <div className="num-overlay" onClick={onClose}>
            <div className="num-card inv-card" onClick={e => e.stopPropagation()}>
                <div className="num-header">
                    <div>
                        <h2 className="num-title">Invite User</h2>
                        <p className="inv-subtitle">Create a secure setup link for a new TickDesk account.</p>
                    </div>
                    <button className="num-close" onClick={onClose}><FiX size={16} /></button>
                </div>

                {invite ? (
                    <div className="num-body">
                        <div className="inv-success">
                            <span className="inv-success-icon"><FiCheckCircle size={20} /></span>
                            <div>
                                <p className="inv-success-title">Invite created</p>
                                <p className="inv-success-copy">{invite.email} can use this link to finish setup.</p>
                            </div>
                        </div>

                        {errors.non_field && <p className="num-err-banner">{errors.non_field}</p>}

                        <div className="num-field">
                            <label className="num-label">Invite Link</label>
                            <div className="inv-copy-row">
                                <input className="num-input" value={invite.invite_url} readOnly />
                                <button type="button" className="inv-copy-btn" onClick={copyInvite}>
                                    <FiCopy size={14} />
                                    {copied ? "Copied" : "Copy"}
                                </button>
                            </div>
                        </div>

                        <div className="inv-system-box">
                            <p className="inv-system-title">System captured</p>
                            <div className="inv-system-grid">
                                <span>Email</span><strong>{invite.email}</strong>
                                <span>Role</span><strong>{invite.role_display}</strong>
                                <span>Company</span><strong>Current workspace</strong>
                                <span>Security</span><strong>Token + 7 day expiry</strong>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="num-body">
                            {errors.non_field && <p className="num-err-banner">{errors.non_field}</p>}

                            <div className="num-field">
                                <label className="num-label">Email Address<span className="num-required">*</span></label>
                                <input
                                    className={`num-input${errors.email ? " num-input-err" : ""}`}
                                    type="email"
                                    name="email"
                                    placeholder="name@company.com"
                                    value={form.email}
                                    onChange={handleChange}
                                />
                                {errors.email && <span className="num-field-err">{errors.email}</span>}
                            </div>

                            <div className="num-row-2">
                                <div className="num-field">
                                    <label className="num-label">Role<span className="num-required">*</span></label>
                                    <select className="num-select" name="role" value={form.role} onChange={handleChange}>
                                        <option value="employee">Employee</option>
                                        <option value="agent">Support Agent</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    {errors.role && <span className="num-field-err">{errors.role}</span>}
                                </div>
                                <div className="num-field">
                                    <label className="num-label">Department</label>
                                    <select className="num-select" name="department" value={form.department} onChange={handleChange}>
                                        <option value="">No Department</option>
                                        {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                    {errors.department && <span className="num-field-err">{errors.department}</span>}
                                </div>
                            </div>

                            <div className="num-field">
                                <label className="num-label">Location</label>
                                <input
                                    className="num-input"
                                    name="location"
                                    placeholder="e.g. Mumbai Office"
                                    value={form.location}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="inv-system-box">
                                <p className="inv-system-title">Required by system</p>
                                <div className="inv-system-grid">
                                    <span>Required input</span><strong>Email and role</strong>
                                    <span>Automatic</span><strong>Company and inviter</strong>
                                    <span>Security</span><strong>Unique token and expiry</strong>
                                    <span>On accept</span><strong>Name and password</strong>
                                </div>
                            </div>
                        </div>

                        <div className="num-footer">
                            <button type="button" className="num-btn-cancel" onClick={onClose}>Cancel</button>
                            <button type="submit" className="num-btn-submit" disabled={submitting}>
                                <FiUserPlus size={14} />
                                {submitting ? "Sending..." : "Create Invite"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

function BulkInviteModal({ onClose }) {
    const [depts, setDepts] = useState([]);
    const [defaults, setDefaults] = useState(EMPTY_BULK_DEFAULTS);
    const [inputMode, setInputMode] = useState("paste");
    const [rawText, setRawText] = useState("");
    const [fileName, setFileName] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [results, setResults] = useState(null);
    const [copiedAll, setCopiedAll] = useState(false);

    useEffect(() => {
        api.get("accounts/departments/?page_size=200")
            .then(r => setDepts(r.data.results ?? []))
            .catch(() => {});
    }, []);

    const handleDefaultChange = (e) => {
        setDefaults(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setErrors(prev => ({ ...prev, non_field: undefined }));
    };

    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const text = await file.text();
            setFileName(file.name);
            setInputMode("upload");
            setRawText(text);
            setErrors(prev => ({ ...prev, non_field: undefined }));
        } catch {
            setErrors({ non_field: "Could not read that file. Try a CSV or plain text file." });
        }
    };

    const downloadTemplate = () => {
        const blob = new Blob([BULK_TEMPLATE], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "tickdesk-bulk-invite-template.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    const previewRows = (() => {
        const parsedRows = parseBulkRows(rawText);
        const seenEmails = new Set();
        const deptByName = new Map(depts.map(dept => [dept.name.trim().toLowerCase(), dept]));

        return parsedRows.map((row) => {
            const email = (row.email || "").trim().toLowerCase();
            const role = (row.role || defaults.role || "employee").trim().toLowerCase();
            const departmentRaw = (row.department || "").trim();
            const location = (row.location || defaults.location || "").trim();
            const errorsList = [];

            let departmentId = defaults.department ? Number(defaults.department) : null;
            let departmentLabel = depts.find(dept => dept.id === Number(defaults.department))?.name || "";

            if (departmentRaw) {
                const deptById = depts.find(dept => String(dept.id) === departmentRaw);
                const deptByLowerName = deptByName.get(departmentRaw.toLowerCase());
                const resolvedDept = deptById || deptByLowerName;
                if (resolvedDept) {
                    departmentId = resolvedDept.id;
                    departmentLabel = resolvedDept.name;
                } else {
                    errorsList.push("Unknown department");
                    departmentId = null;
                    departmentLabel = departmentRaw;
                }
            }

            if (!email) errorsList.push("Missing email");
            if (!roleConfig[role]) errorsList.push("Invalid role");
            if (email && seenEmails.has(email)) errorsList.push("Duplicate email");
            if (email) seenEmails.add(email);

            return {
                line: row._line,
                email,
                role,
                departmentId,
                departmentLabel,
                location,
                errors: errorsList,
            };
        });
    })();

    const validRows = previewRows.filter(row => row.email && row.errors.length === 0);
    const invalidRows = previewRows.filter(row => row.errors.length > 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        if (!validRows.length) {
            setErrors({ non_field: "Add at least one valid row before sending invites." });
            return;
        }

        setSubmitting(true);
        try {
            const res = await api.post("accounts/users/invite/bulk/", {
                invites: validRows.map(row => ({
                    email: row.email,
                    role: row.role,
                    department: row.departmentId || undefined,
                    location: row.location,
                })),
            });
            setResults(res.data);
        } catch (err) {
            const data = err.response?.data;
            if (data && typeof data === "object") setErrors(data);
            else setErrors({ non_field: "Bulk invite failed. Please try again." });
        } finally {
            setSubmitting(false);
        }
    };

    const copyAllLinks = async () => {
        const links = (results?.results || [])
            .filter(item => item.status === "created" && item.invite?.invite_url)
            .map(item => item.invite.invite_url);
        if (!links.length) return;
        try {
            await navigator.clipboard.writeText(links.join("\n"));
            setCopiedAll(true);
            setTimeout(() => setCopiedAll(false), 1800);
        } catch {
            setErrors({ non_field: "Bulk invites created, but copying links failed." });
        }
    };

    return (
        <div className="num-overlay" onClick={onClose}>
            <div className="num-card binv-card" onClick={e => e.stopPropagation()}>
                <div className="num-header">
                    <div>
                        <h2 className="num-title">Bulk Invite</h2>
                        <p className="inv-subtitle">Paste rows or upload a CSV to generate invite links in one pass.</p>
                    </div>
                    <button className="num-close" onClick={onClose}><FiX size={16} /></button>
                </div>

                {results ? (
                    <div className="num-body">
                        <div className="inv-success">
                            <span className="inv-success-icon"><FiCheckCircle size={20} /></span>
                            <div>
                                <p className="inv-success-title">Bulk invite processed</p>
                                <p className="inv-success-copy">
                                    Created {results.summary.created} of {results.summary.total} invite{results.summary.total === 1 ? "" : "s"}.
                                </p>
                            </div>
                        </div>

                        <div className="binv-summary-grid">
                            <div className="binv-metric"><strong>{results.summary.total}</strong><span>Total</span></div>
                            <div className="binv-metric"><strong>{results.summary.created}</strong><span>Created</span></div>
                            <div className="binv-metric"><strong>{results.summary.invalid}</strong><span>Invalid</span></div>
                        </div>

                        <div className="binv-review-wrap">
                            <div className="binv-review-head">
                                <p className="inv-system-title" style={{ marginBottom: 0 }}>Invite results</p>
                                <button type="button" className="inv-copy-btn" onClick={copyAllLinks}>
                                    <FiCopy size={14} />
                                    {copiedAll ? "Copied" : "Copy Links"}
                                </button>
                            </div>
                            <div className="binv-table-scroll">
                                <table className="binv-table">
                                    <thead>
                                        <tr>
                                            <th>Email</th>
                                            <th>Status</th>
                                            <th>Link / Error</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.results.map(item => (
                                            <tr key={`${item.index}-${item.email}`}>
                                                <td>{item.email || "—"}</td>
                                                <td>
                                                    <span className={`binv-status-pill${item.status === "created" ? " ok" : " bad"}`}>
                                                        {item.status === "created" ? "Created" : "Invalid"}
                                                    </span>
                                                </td>
                                                <td className="binv-cell-wrap">
                                                    {item.status === "created"
                                                        ? item.invite?.invite_url
                                                        : Object.values(item.errors || {}).join(" ")}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="num-body">
                            {errors.non_field && <p className="num-err-banner">{errors.non_field}</p>}

                            <div className="binv-tabs">
                                <button type="button" className={`binv-tab${inputMode === "paste" ? " binv-tab-active" : ""}`} onClick={() => setInputMode("paste")}>Paste</button>
                                <button type="button" className={`binv-tab${inputMode === "upload" ? " binv-tab-active" : ""}`} onClick={() => setInputMode("upload")}>CSV Upload</button>
                                <button type="button" className="binv-template-link" onClick={downloadTemplate}>Download Template</button>
                            </div>

                            <div className="num-row-2">
                                <div className="num-field">
                                    <label className="num-label">Default Role</label>
                                    <select className="num-select" name="role" value={defaults.role} onChange={handleDefaultChange}>
                                        <option value="employee">Employee</option>
                                        <option value="agent">Support Agent</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="num-field">
                                    <label className="num-label">Default Department</label>
                                    <select className="num-select" name="department" value={defaults.department} onChange={handleDefaultChange}>
                                        <option value="">No Department</option>
                                        {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="num-field">
                                <label className="num-label">Default Location</label>
                                <input
                                    className="num-input"
                                    name="location"
                                    placeholder="e.g. Mumbai Office"
                                    value={defaults.location}
                                    onChange={handleDefaultChange}
                                />
                            </div>

                            {inputMode === "upload" && (
                                <div className="num-field">
                                    <label className="num-label">Upload CSV</label>
                                    <label className="binv-upload">
                                        <FiUpload size={16} />
                                        <span>{fileName || "Choose a CSV or text file"}</span>
                                        <input type="file" accept=".csv,.txt" onChange={handleFile} hidden />
                                    </label>
                                </div>
                            )}

                            <div className="num-field">
                                <label className="num-label">Invite Rows</label>
                                <textarea
                                    className="num-input binv-textarea"
                                    placeholder={"email,role,department,location\nalex@company.com,employee,IT,Mumbai Office"}
                                    value={rawText}
                                    onChange={e => setRawText(e.target.value)}
                                />
                            </div>

                            <div className="inv-system-box">
                                <p className="inv-system-title">Accepted formats</p>
                                <div className="inv-system-grid">
                                    <span>One column</span><strong>Email only, one per line</strong>
                                    <span>CSV columns</span><strong>email, role, department, location</strong>
                                    <span>Department</span><strong>Name or numeric id</strong>
                                    <span>Defaults</span><strong>Applied when a row leaves a field blank</strong>
                                </div>
                            </div>

                            <div className="binv-review-wrap">
                                <div className="binv-review-head">
                                    <p className="inv-system-title" style={{ marginBottom: 0 }}>Review rows</p>
                                    <div className="binv-counts">
                                        <span>{previewRows.length} total</span>
                                        <span>{validRows.length} valid</span>
                                        <span>{invalidRows.length} invalid</span>
                                    </div>
                                </div>
                                <div className="binv-table-scroll">
                                    <table className="binv-table">
                                        <thead>
                                            <tr>
                                                <th>Line</th>
                                                <th>Email</th>
                                                <th>Role</th>
                                                <th>Department</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewRows.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="binv-empty">Paste rows or upload a CSV to preview invites.</td>
                                                </tr>
                                            ) : previewRows.map(row => (
                                                <tr key={`${row.line}-${row.email || "empty"}`}>
                                                    <td>{row.line}</td>
                                                    <td>{row.email || "—"}</td>
                                                    <td>{roleConfig[row.role]?.label || row.role || "—"}</td>
                                                    <td>{row.departmentLabel || "—"}</td>
                                                    <td>
                                                        {row.errors.length === 0 ? (
                                                            <span className="binv-status-pill ok">Ready</span>
                                                        ) : (
                                                            <span className="binv-status-pill bad">{row.errors.join(", ")}</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="num-footer">
                            <button type="button" className="num-btn-cancel" onClick={onClose}>Cancel</button>
                            <button type="submit" className="num-btn-submit" disabled={submitting || validRows.length === 0}>
                                <FiUpload size={14} />
                                {submitting ? "Sending..." : `Send ${validRows.length} Invite${validRows.length === 1 ? "" : "s"}`}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

function Users() {
    const [searchParams] = useSearchParams();
    const initialTab = searchParams.get("tab");
    const [activeTab,    setActiveTab]    = useState(
        TABS.some(t => t.key === initialTab) ? initialTab : "all"
    );
    const [search,       setSearch]       = useState("");
    const [page,         setPage]         = useState(1);

    const [stats,        setStats]        = useState(null);
    const [userList,     setUserList]     = useState([]);
    const [inviteList,   setInviteList]   = useState([]);
    const [totalCount,   setTotalCount]   = useState(0);
    const [pageSize,     setPageSize]     = useState(10);
    const [deptDist,     setDeptDist]     = useState([]);
    const [roleBreakdown,setRoleBreakdown]= useState([]);

    const [selectedUser, setSelectedUser] = useState(null);
    const [drawerDetail, setDrawerDetail] = useState(null);
    const [loadingDrawer,setLoadingDrawer]= useState(false);
    const [showModal,    setShowModal]    = useState(false);
    const [showInvite,   setShowInvite]   = useState(false);
    const [showBulkInvite, setShowBulkInvite] = useState(false);
    const departmentFilter = searchParams.get("department") || "";
    const departmentName = searchParams.get("departmentName") || "";

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
        const role = TABS.find(t => t.key === activeTab)?.role;
        const params = { page };
        if (role) params.role = role;
        if (search) params.search = search;
        if (departmentFilter) params.department = departmentFilter;

        if (activeTab === "invited") {
            api.get("accounts/users/invitations/", { params }).then(r => {
                setInviteList(r.data.results);
                setTotalCount(r.data.count);
                setPageSize(r.data.page_size);
            }).catch(() => {});
            return;
        }

        api.get("accounts/users/", { params }).then(r => {
            setUserList(r.data.results);
            setTotalCount(r.data.count);
            setPageSize(r.data.page_size);
        }).catch(() => {});
    }, [activeTab, search, page, departmentFilter]);

    function refreshAll() {
        api.get("accounts/users/stats/").then(r => setStats(r.data)).catch(() => {});
        api.get("accounts/users/dept-distribution/").then(r => setDeptDist(r.data)).catch(() => {});
        api.get("accounts/users/role-breakdown/").then(r => setRoleBreakdown(r.data)).catch(() => {});
        const role   = TABS.find(t => t.key === activeTab)?.role;
        const params = { page: 1 };
        if (role)   params.role   = role;
        if (search) params.search = search;
        if (departmentFilter) params.department = departmentFilter;

        const endpoint = activeTab === "invited"
            ? "accounts/users/invitations/"
            : "accounts/users/";

        api.get(endpoint, { params }).then(r => {
            if (activeTab === "invited") setInviteList(r.data.results);
            else setUserList(r.data.results);
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
    const toolbarNote = useMemo(() => (
        departmentName ? `Showing ${activeTab === "invited" ? "invites" : "users"} for ${departmentName}` : ""
    ), [activeTab, departmentName]);

    return (
        <div className="usr-page">

            {showModal && (
                <NewUserModal
                    onClose={() => setShowModal(false)}
                    onCreated={refreshAll}
                />
            )}
            {showInvite && (
                <InviteUserModal onClose={() => setShowInvite(false)} />
            )}
            {showBulkInvite && (
                <BulkInviteModal onClose={() => setShowBulkInvite(false)} />
            )}

            {/* ── Header ── */}
            <div className="usr-header">
                <div>
                    <h1 className="usr-title">Users</h1>
                    <p className="usr-subtitle">
                        {departmentName
                            ? `Manage employees, support agents and administrators in ${departmentName}`
                            : "Manage employees, support agents and administrators"}
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
                {STAT_META.map(({ Icon, label, key, color, bg }) => {
                    const delta = stats?.[`${key}_delta`];
                    const trend = stats?.[`${key}_trend`];
                    const isSteady = delta === "steady";
                    return (
                        <div key={key} className="usr-stat-card">
                            <div className="usr-stat-icon" style={{ background: bg, color }}>
                                <Icon size={20} />
                            </div>
                            <div className="usr-stat-text">
                                <p className="usr-stat-label">{label}</p>
                                <p className="usr-stat-value">
                                    {stats ? stats[key].toLocaleString() : "—"}
                                </p>
                                {delta && (
                                    <div className={`usr-trend ${isSteady ? "usr-trend-neutral" : "usr-trend-up"}`}>
                                        <span className="usr-trend-arrow">{isSteady ? "→" : "↑"}</span>
                                        <span className="usr-trend-pct">{delta}</span>
                                    </div>
                                )}
                                {trend?.length > 0 && <div style={{ marginTop: 6, width: 100 }}><Sparkline points={trend} color={color} /></div>}
                            </div>
                        </div>
                    );
                })}
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
                        {toolbarNote && (
                            <div style={{ padding: "0 20px 12px", color: "#2563eb", fontSize: "13px", fontWeight: 600 }}>
                                {toolbarNote}
                            </div>
                        )}

                        {/* Table */}
                        <div className="usr-table-scroll">
                            <table className="usr-table">
                                <thead>
                                    {activeTab === "invited" ? (
                                        <tr>
                                            <th>EMAIL</th>
                                            <th>ROLE</th>
                                            <th>INVITE STATUS</th>
                                            <th>ACCEPTED BY</th>
                                            <th>LOGIN STATUS</th>
                                            <th>LAST LOGIN</th>
                                        </tr>
                                    ) : (
                                        <tr>
                                            <th>NAME</th>
                                            <th>ID</th>
                                            <th>DEPARTMENT</th>
                                            <th>ROLE</th>
                                            <th>STATUS</th>
                                            <th></th>
                                        </tr>
                                    )}
                                </thead>
                                <tbody>
                                    {activeTab === "invited" ? inviteList.map(invite => (
                                        <tr key={invite.id}>
                                            <td>
                                                <div>
                                                    <p className="usr-name">{invite.email}</p>
                                                    <p className="usr-email">Invited {fmtDateTime(invite.created_at)}</p>
                                                </div>
                                            </td>
                                            <td><RoleBadge role={invite.role} /></td>
                                            <td><InviteStatusBadge status={invite.status} /></td>
                                            <td>
                                                <div>
                                                    <p className="usr-name">{invite.accepted_user_name || "—"}</p>
                                                    <p className="usr-email">
                                                        {invite.accepted_at ? `Accepted ${fmtDateTime(invite.accepted_at)}` : "Not accepted yet"}
                                                    </p>
                                                </div>
                                            </td>
                                            <td><LoginStateBadge hasLoggedIn={invite.has_logged_in} /></td>
                                            <td className="usr-col-dept">{fmtDateTime(invite.last_login)}</td>
                                        </tr>
                                    )) : userList.map(u => (
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
                                    {(activeTab === "invited" ? inviteList.length === 0 : userList.length === 0) && (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                style={{ textAlign: "center", padding: "32px", color: "#9ca3af" }}
                                            >
                                                {activeTab === "invited" ? "No invited users found" : "No users found"}
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
                                    ? `Showing ${pageStart}–${pageEnd} of ${totalCount.toLocaleString()} ${activeTab === "invited" ? "invites" : "users"}`
                                    : activeTab === "invited" ? "No invites" : "No users"}
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
                                <button
                                    key={label}
                                    className="usr-qa-tile"
                                    onClick={
                                        label === "Invite User"
                                            ? () => setShowInvite(true)
                                            : label === "Bulk Invite"
                                                ? () => setShowBulkInvite(true)
                                                : undefined
                                    }
                                >
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
