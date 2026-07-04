import { useState } from "react";
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
} from "react-icons/fi";

// ─── Static data ──────────────────────────────────────────────────────────────

const userStats = [
    {
        Icon: FiUsers,
        label: "TOTAL USERS",
        value: "1,284",
        color: "#2563eb",
        bg: "#eff6ff",
        badge: "+4% ↑",
        badgeType: "green",
    },
    {
        Icon: FiUserCheck,
        label: "ACTIVE USERS",
        value: "1,152",
        color: "#16a34a",
        bg: "#f0fdf4",
        badge: "+12% ↑",
        badgeType: "green",
    },
    {
        Icon: FiHeadphones,
        label: "SUPPORT AGENTS",
        value: "24",
        color: "#ea580c",
        bg: "#fff7ed",
        badge: "Steady",
        badgeType: "gray",
    },
    {
        Icon: FiShield,
        label: "ADMINISTRATORS",
        value: "8",
        color: "#7c3aed",
        bg: "#faf5ff",
        badge: "Secured",
        badgeType: "gray",
    },
];

const TABS = [
    { key: "all",   label: "All Users"      },
    { key: "emp",   label: "Employees"      },
    { key: "agent", label: "Support Agents" },
    { key: "admin", label: "Admins"         },
];

const users = [
    {
        id: 1,
        name: "Aarav Sharma",
        email: "aarav.s@tickdesk.com",
        empId: "TD-1092",
        department: "IT",
        role: "Employee",
        status: "Active",
        location: "Mumbai, IN",
        reportsTo: "Vikram Joshi",
        initials: "AS",
        avatarColor: "#2563eb",
        assets: [
            { type: "laptop", name: 'MacBook Pro 14"',  serial: "MBP-2024-0112" },
            { type: "phone",  name: "iPhone 15 Pro",     serial: "IPH-2024-0334" },
        ],
        activity: [
            { text: "Logged in from Mumbai office",     time: "2 hours ago"  },
            { text: "Submitted ticket TK-1092",         time: "Yesterday"    },
            { text: 'Asset MacBook Pro 14" assigned',   time: "Mar 12, 2024" },
        ],
    },
    {
        id: 2,
        name: "Neha Gupta",
        email: "neha.g@tickdesk.com",
        empId: "TD-0842",
        department: "Finance",
        role: "Admin",
        status: "Active",
        location: "Delhi, IN",
        reportsTo: "Sunita Rao",
        initials: "NG",
        avatarColor: "#7c3aed",
        assets: [
            { type: "laptop", name: "MacBook Air M2",    serial: "MBA-2023-0578" },
            { type: "phone",  name: 'iPad Pro 12.9"',    serial: "IPD-2023-0892" },
        ],
        activity: [
            { text: "Updated permissions for 3 accounts", time: "1 hour ago"  },
            { text: "Exported payroll report Q3",          time: "2 days ago"  },
            { text: "Admin role assigned by Super Admin",  time: "Jan 5, 2024" },
        ],
    },
    {
        id: 3,
        name: "Rohit Mehta",
        email: "rohit.m@tickdesk.com",
        empId: "TD-1120",
        department: "HR",
        role: "Support Agent",
        status: "Busy",
        location: "Pune, IN",
        reportsTo: "Anjali Desai",
        initials: "RM",
        avatarColor: "#16a34a",
        assets: [
            { type: "laptop", name: "Dell Latitude 5540", serial: "DEL-2024-0219" },
        ],
        activity: [
            { text: "Handling 3 active support tickets",       time: "Just now"    },
            { text: "Resolved ticket TK-1044 (Printer issue)", time: "3 hours ago" },
            { text: "Completed onboarding for 2 new hires",    time: "Last week"   },
        ],
    },
    {
        id: 4,
        name: "Priya Nair",
        email: "priya.n@tickdesk.com",
        empId: "TD-0955",
        department: "Marketing",
        role: "Employee",
        status: "Inactive",
        location: "Bengaluru, IN",
        reportsTo: "Rahul Verma",
        initials: "PN",
        avatarColor: "#d97706",
        assets: [
            { type: "laptop", name: "MacBook Air M1", serial: "MBA-2022-0401" },
        ],
        activity: [
            { text: "Account deactivated by Admin",    time: "2 days ago"   },
            { text: "Last login from Bengaluru office", time: "Oct 20, 2023" },
            { text: "Submitted offboarding request",   time: "Oct 18, 2023" },
        ],
    },
    {
        id: 5,
        name: "Samantha Reed",
        email: "samantha.r@tickdesk.com",
        empId: "TD-0731",
        department: "IT",
        role: "Support Agent",
        status: "Active",
        location: "Mumbai, IN",
        reportsTo: "Vikram Joshi",
        initials: "SR",
        avatarColor: "#0891b2",
        assets: [
            { type: "laptop", name: 'MacBook Pro 16"',     serial: "MBP-2023-0892" },
            { type: "laptop", name: 'Dell UltraSharp 27"', serial: "DEL-2023-1102" },
        ],
        activity: [
            { text: "Resolved 5 tickets this week",              time: "Today"       },
            { text: "Escalated TK-1043 to Level 2 support",      time: "Yesterday"   },
            { text: "Completed IT Security certification",        time: "Mar 1, 2024" },
        ],
    },
    {
        id: 6,
        name: "Karan Shah",
        email: "karan.s@tickdesk.com",
        empId: "TD-1205",
        department: "Operations",
        role: "Employee",
        status: "Active",
        location: "Ahmedabad, IN",
        reportsTo: "Manish Patel",
        initials: "KS",
        avatarColor: "#dc2626",
        assets: [
            { type: "laptop", name: "ThinkPad X1 Carbon", serial: "LNV-2024-0667" },
            { type: "phone",  name: "iPhone 14",          serial: "IPH-2023-1234" },
        ],
        activity: [
            { text: "Checked in from Ahmedabad HQ", time: "1 hour ago"   },
            { text: "Asset iPhone 14 assigned",      time: "Feb 10, 2024" },
            { text: "Joined Operations team",        time: "Jan 15, 2024" },
        ],
    },
];

const deptDistribution = [
    { label: "IT",         pct: 32, color: "#2563eb" },
    { label: "Finance",    pct: 18, color: "#7c3aed" },
    { label: "HR",         pct: 12, color: "#16a34a" },
    { label: "Marketing",  pct: 22, color: "#f59e0b" },
    { label: "Operations", pct: 16, color: "#ea580c" },
];

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

// ─── Donut chart constants ────────────────────────────────────────────────────

const C = 2 * Math.PI * 50; // ≈ 314.159

const donutSegments = [
    { pct: 68, color: "#2563eb", label: "Employees", offset: 0          },
    { pct: 22, color: "#7c3aed", label: "Agents",    offset: 0.68 * C   },
    { pct: 10, color: "#ea580c", label: "Admins",    offset: 0.90 * C   },
];

// ─── Role / Status config ─────────────────────────────────────────────────────

const roleConfig = {
    "Employee":      { bg: "#eff6ff", color: "#2563eb" },
    "Admin":         { bg: "#fef2f2", color: "#dc2626" },
    "Support Agent": { bg: "#fff7ed", color: "#ea580c" },
};

const statusConfig = {
    "Active":   { dot: "#16a34a" },
    "Busy":     { dot: "#ea580c" },
    "Inactive": { dot: "#9ca3af" },
};

// ─── Small helper components ─────────────────────────────────────────────────

function RoleBadge({ role }) {
    const cfg = roleConfig[role] || { bg: "#f3f4f6", color: "#374151" };
    return (
        <span className="usr-role-badge" style={{ background: cfg.bg, color: cfg.color }}>
            {role}
        </span>
    );
}

function StatusDot({ status }) {
    const cfg = statusConfig[status] || { dot: "#9ca3af" };
    return (
        <span className="usr-status-cell">
            <span className="usr-status-dot" style={{ background: cfg.dot }} />
            {status}
        </span>
    );
}

// ─── User Detail Drawer ───────────────────────────────────────────────────────

function UserDrawer({ user, onClose }) {
    const isOpen = !!user;

    return (
        <>
            {/* Overlay */}
            <div
                className={`udr-overlay${isOpen ? " udr-overlay-show" : ""}`}
                onClick={onClose}
            />

            {/* Panel */}
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
                                        background: `linear-gradient(135deg, ${user.avatarColor} 0%, ${user.avatarColor}99 100%)`,
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
                                            style={{ background: (statusConfig[user.status] || {}).dot || "#9ca3af" }}
                                        />
                                        {user.status}
                                    </span>
                                </div>
                            </div>

                            {/* General Information */}
                            <div className="udr-section">
                                <p className="udr-section-title">GENERAL INFORMATION</p>
                                <div className="udr-info-grid">
                                    <div className="udr-info-item">
                                        <span className="udr-info-key">Department</span>
                                        <span className="udr-info-val">{user.department}</span>
                                    </div>
                                    <div className="udr-info-item">
                                        <span className="udr-info-key">Employee ID</span>
                                        <span className="udr-info-val">{user.empId}</span>
                                    </div>
                                    <div className="udr-info-item">
                                        <span className="udr-info-key">Reports To</span>
                                        <span className="udr-info-val">{user.reportsTo}</span>
                                    </div>
                                    <div className="udr-info-item">
                                        <span className="udr-info-key">Location</span>
                                        <span className="udr-info-val">{user.location}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Assigned Assets */}
                            <div className="udr-section">
                                <p className="udr-section-title">
                                    ASSIGNED ASSETS ({user.assets.length})
                                </p>
                                <div className="udr-assets-list">
                                    {user.assets.map((asset, i) => (
                                        <div key={i} className="udr-asset-row">
                                            <div className="udr-asset-icon">
                                                {asset.type === "laptop"
                                                    ? <FiHardDrive size={14} />
                                                    : <FiSmartphone size={14} />}
                                            </div>
                                            <div className="udr-asset-info">
                                                <p className="udr-asset-name">{asset.name}</p>
                                                <p className="udr-asset-serial">{asset.serial}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div className="udr-section">
                                <p className="udr-section-title">RECENT ACTIVITY</p>
                                <div className="udr-activity-list">
                                    {user.activity.map((act, i) => (
                                        <div key={i} className="udr-activity-item">
                                            <div className="udr-act-dot-col">
                                                <span className="udr-act-dot" />
                                                {i < user.activity.length - 1 && (
                                                    <span className="udr-act-line" />
                                                )}
                                            </div>
                                            <div className="udr-act-body">
                                                <p className="udr-act-text">{act.text}</p>
                                                <p className="udr-act-time">{act.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>

                        {/* Footer actions */}
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

// ─── Users Page ───────────────────────────────────────────────────────────────

function Users() {
    const [activeTab, setActiveTab]       = useState("all");
    const [selectedUser, setSelectedUser] = useState(null);

    return (
        <div className="usr-page">

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
                    <button className="usr-btn-primary"><FiPlus size={13} /> New User</button>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <section className="usr-stats">
                {userStats.map(({ Icon, label, value, color, bg, badge, badgeType }) => (
                    <div key={label} className="usr-stat-card">
                        <div className="usr-stat-icon" style={{ background: bg, color }}>
                            <Icon size={20} />
                        </div>
                        <div className="usr-stat-text">
                            <p className="usr-stat-label">{label}</p>
                            <div className="usr-stat-row">
                                <p className="usr-stat-value">{value}</p>
                                <span className={`usr-stat-badge usr-badge-${badgeType}`}>{badge}</span>
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
                                <input className="usr-search" placeholder="Search users..." />
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
                                    {users.map(u => (
                                        <tr
                                            key={u.id}
                                            className="usr-row"
                                            onClick={() => setSelectedUser(u)}
                                        >
                                            <td>
                                                <div className="usr-name-cell">
                                                    <div
                                                        className="usr-avatar"
                                                        style={{ background: u.avatarColor }}
                                                    >
                                                        {u.initials}
                                                    </div>
                                                    <div>
                                                        <p className="usr-name">{u.name}</p>
                                                        <p className="usr-email">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="usr-col-id">{u.empId}</td>
                                            <td className="usr-col-dept">{u.department}</td>
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
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="usr-pagination">
                            <span className="usr-pag-info">Showing 1-6 of 1,284 users</span>
                            <div className="usr-pag-controls">
                                <button className="usr-pag-btn">
                                    <FiChevronLeft size={13} />
                                </button>
                                <button className="usr-pag-btn usr-pag-active">1</button>
                                <button className="usr-pag-btn">2</button>
                                <button className="usr-pag-btn">3</button>
                                <button className="usr-pag-btn">
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
                            {deptDistribution.map(d => (
                                <div key={d.label} className="usr-dist-item">
                                    <div className="usr-dist-row">
                                        <span className="usr-dist-label">{d.label}</span>
                                        <span className="usr-dist-pct">{d.pct}%</span>
                                    </div>
                                    <div className="usr-dist-track">
                                        <div
                                            className="usr-dist-fill"
                                            style={{ width: `${d.pct}%`, background: d.color }}
                                        />
                                    </div>
                                </div>
                            ))}
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
                                {/* Background ring */}
                                <circle
                                    cx="70" cy="70" r="50"
                                    fill="none"
                                    stroke="#f1f5f9"
                                    strokeWidth="20"
                                />
                                {/* Colored segments */}
                                {donutSegments.map((seg, i) => (
                                    <circle
                                        key={i}
                                        cx="70"
                                        cy="70"
                                        r="50"
                                        fill="none"
                                        stroke={seg.color}
                                        strokeWidth="20"
                                        strokeDasharray={`${(seg.pct / 100) * C} ${C}`}
                                        strokeDashoffset={-seg.offset}
                                        strokeLinecap="butt"
                                        transform="rotate(-90 70 70)"
                                    />
                                ))}
                                {/* Center labels */}
                                <text
                                    x="70"
                                    y="66"
                                    textAnchor="middle"
                                    className="usr-donut-val"
                                >
                                    1.2k
                                </text>
                                <text
                                    x="70"
                                    y="82"
                                    textAnchor="middle"
                                    className="usr-donut-sub"
                                >
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
                onClose={() => setSelectedUser(null)}
            />

        </div>
    );
}

export default Users;
