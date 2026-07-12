import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    FiBell, FiSearch, FiChevronDown, FiHelpCircle,
    FiUser, FiMail, FiShield, FiLogOut, FiSettings,
    FiTag, FiCheckCircle, FiMessageSquare, FiBox, FiBriefcase,
} from "react-icons/fi";
import api from "../../services/api";
import "./Navbar.css";

const PAGE_TITLES = {
    "/dashboard":      "Dashboard",
    "/assets":         "Assets",
    "/tickets":        "Tickets",
    "/users":          "Users",
    "/departments":    "Departments",
    "/reports":        "Reports",
    "/knowledge-base": "Knowledge Base",
    "/profile":        "My Profile",
    "/platform":               "Dashboard",
    "/platform/companies":     "Companies",
    "/platform/announcements":"Announcements",
    "/platform/reports":       "Reports",
    "/settings":       "Settings",
};

function getTitle(pathname) {
    if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
    if (pathname.startsWith("/tickets/")) return "Ticket Detail";
    if (pathname.startsWith("/assets/"))  return "Asset Detail";
    if (pathname.startsWith("/platform/companies/")) return "Company Detail";
    if (pathname.startsWith("/settings")) return "Settings";
    return "TickDesk";
}

function avatarInitials(firstName, lastName, username) {
    if (firstName && lastName) return (firstName[0] + lastName[0]).toUpperCase();
    if (firstName) return firstName.slice(0, 2).toUpperCase();
    if (username)  return username.slice(0, 2).toUpperCase();
    return "??";
}

const NOTIF_ICON = {
    ticket_assigned:    <FiTag size={14} />,
    ticket_status:      <FiCheckCircle size={14} />,
    ticket_comment:     <FiMessageSquare size={14} />,
    asset_assigned:     <FiBox size={14} />,
    company_registered: <FiBriefcase size={14} />,
};
const NOTIF_COLOR = {
    ticket_assigned:    "#3b82f6",
    ticket_status:      "#22c55e",
    ticket_comment:     "#f59e0b",
    asset_assigned:     "#6366f1",
    company_registered: "#2563eb",
};

function Navbar() {
    const { pathname } = useLocation();
    const navigate     = useNavigate();

    const [profile,       setProfile]       = useState(null);
    const [open,          setOpen]          = useState(false);
    const [notifOpen,     setNotifOpen]     = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unread,        setUnread]        = useState(0);

    const dropdownRef  = useRef(null);
    const notifRef     = useRef(null);
    const prevUnread   = useRef(null);

    const playNotifSound = () => {
        try {
            const ctx  = new (window.AudioContext || window.webkitAudioContext)();
            const play = (freq, start, duration) => {
                const osc  = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
                gain.gain.setValueAtTime(0, ctx.currentTime + start);
                gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + start + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
                osc.start(ctx.currentTime + start);
                osc.stop(ctx.currentTime + start + duration);
            };
            play(880, 0,    0.12);
            play(1100, 0.13, 0.18);
        } catch { /* ignore if audio blocked */ }
    };

    // Fetch profile once
    useEffect(() => {
        api.get("accounts/profile/").then(r => setProfile(r.data)).catch(() => {});
    }, []);

    // Fetch notifications + poll every 30s
    const fetchNotifications = useCallback(() => {
        api.get("notifications/").then(r => {
            const newUnread = r.data.unread || 0;
            setNotifications(r.data.results || []);
            setUnread(newUnread);
            // Play sound only when unread count increases (new notification arrived)
            if (prevUnread.current !== null && newUnread > prevUnread.current) {
                playNotifSound();
            }
            prevUnread.current = newUnread;
        }).catch(() => {});
    }, []);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Close profile dropdown on outside click
    useEffect(() => {
        if (!open) return;
        const h = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, [open]);

    // Close notification panel on outside click
    useEffect(() => {
        if (!notifOpen) return;
        const h = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, [notifOpen]);

    const handleNotifClick = async (n) => {
        if (!n.is_read) {
            await api.patch(`notifications/${n.id}/read/`).catch(() => {});
            setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
            setUnread(u => Math.max(0, u - 1));
        }
        setNotifOpen(false);
        if (n.link) navigate(n.link);
    };

    const markAllRead = async () => {
        await api.post("notifications/mark-all-read/").catch(() => {});
        setNotifications(prev => prev.map(x => ({ ...x, is_read: true })));
        setUnread(0);
    };

    const handleLogout = () => {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("role");
        navigate("/login");
    };

    const initials         = profile ? avatarInitials(profile.first_name, profile.last_name, profile.username) : "…";
    const displayName      = profile ? (profile.first_name || profile.username) : "…";
    const roleLabel        = profile ? (profile.role.charAt(0).toUpperCase() + profile.role.slice(1)) : "";
    const fullName         = profile ? `${profile.first_name} ${profile.last_name}`.trim() : "";
    const canOpenSettings  = profile?.role === "admin";

    return (
        <header className="navbar">

            <h1 className="page-title">{getTitle(pathname)}</h1>

            <div className="navbar-center">
                <div className="search-box">
                    <FiSearch className="search-icon" />
                    <input type="text" placeholder="Search tickets, assets, users..." />
                </div>
            </div>

            <div className="navbar-actions">

                <button className="nav-icon-btn" title="Help">
                    <FiHelpCircle />
                </button>

                {/* ── Notification Bell ── */}
                <div className="notif-wrapper" ref={notifRef}>
                    <button
                        className="nav-icon-btn notif-btn"
                        title="Notifications"
                        onClick={() => { setNotifOpen(o => !o); setOpen(false); }}
                    >
                        <FiBell />
                        {unread > 0 && (
                            <span className="notif-badge">{unread > 99 ? "99+" : unread}</span>
                        )}
                    </button>

                    {notifOpen && (
                        <div className="notif-panel">
                            <div className="notif-panel-header">
                                <span className="notif-panel-title">Notifications</span>
                                {unread > 0 && (
                                    <button className="notif-mark-all" onClick={markAllRead}>
                                        Mark all read
                                    </button>
                                )}
                            </div>

                            <div className="notif-list">
                                {notifications.length === 0 ? (
                                    <div className="notif-empty">
                                        <FiBell size={28} className="notif-empty-icon" />
                                        <p>You're all caught up!</p>
                                    </div>
                                ) : notifications.map(n => (
                                    <div
                                        key={n.id}
                                        className={`notif-item${n.is_read ? "" : " notif-unread"}`}
                                        onClick={() => handleNotifClick(n)}
                                    >
                                        <div
                                            className="notif-icon-wrap"
                                            style={{ background: (NOTIF_COLOR[n.type] || "#64748b") + "18", color: NOTIF_COLOR[n.type] || "#64748b" }}
                                        >
                                            {NOTIF_ICON[n.type] || <FiBell size={14} />}
                                        </div>
                                        <div className="notif-content">
                                            <p className="notif-title">{n.title}</p>
                                            {n.body && <p className="notif-body">{n.body}</p>}
                                            <p className="notif-time">{n.time}</p>
                                        </div>
                                        {!n.is_read && <span className="notif-dot" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="nav-divider" />

                {/* ── Profile Dropdown ── */}
                <div className="profile-wrapper" ref={dropdownRef}>
                    <div className="profile" onClick={() => { setOpen(o => !o); setNotifOpen(false); }}>
                        <div className="avatar">{initials}</div>
                        <div className="profile-info">
                            <span className="username">{displayName}</span>
                            <span className="role">{roleLabel}</span>
                        </div>
                        <FiChevronDown className={`chevron-icon${open ? " chevron-open" : ""}`} />
                    </div>

                    {open && (
                        <div className="profile-dropdown">
                            <div className="pd-card">
                                <div className="pd-avatar">{initials}</div>
                                <div className="pd-card-info">
                                    <p className="pd-name">{fullName || displayName}</p>
                                    <span className="pd-role-badge">{roleLabel}</span>
                                </div>
                            </div>
                            <div className="pd-divider" />
                            <div className="pd-details">
                                <div className="pd-row"><FiMail size={13} className="pd-row-icon" /><span>{profile?.email || "—"}</span></div>
                                <div className="pd-row"><FiUser size={13} className="pd-row-icon" /><span>@{profile?.username || "—"}</span></div>
                                <div className="pd-row"><FiShield size={13} className="pd-row-icon" /><span>{roleLabel}</span></div>
                            </div>
                            <div className="pd-divider" />
                            <div className="pd-actions">
                                <button className="pd-action-btn" onClick={() => { navigate("/profile"); setOpen(false); }}>
                                    <FiUser size={14} /> My Profile
                                </button>
                                {canOpenSettings && (
                                    <button className="pd-action-btn" onClick={() => { navigate("/settings"); setOpen(false); }}>
                                        <FiSettings size={14} /> Settings
                                    </button>
                                )}
                                <button className="pd-action-btn pd-logout-btn" onClick={handleLogout}>
                                    <FiLogOut size={14} /> Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </header>
    );
}

export default Navbar;
