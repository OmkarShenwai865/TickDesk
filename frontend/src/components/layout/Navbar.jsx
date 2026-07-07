import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    FiBell,
    FiSearch,
    FiChevronDown,
    FiHelpCircle,
    FiUser,
    FiMail,
    FiShield,
    FiLogOut,
    FiSettings,
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
    "/settings":       "Settings",
};

function getTitle(pathname) {
    if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
    if (pathname.startsWith("/tickets/")) return "Ticket Detail";
    if (pathname.startsWith("/settings")) return "Settings";
    return "TickDesk";
}

function avatarInitials(firstName, lastName, username) {
    if (firstName && lastName) return (firstName[0] + lastName[0]).toUpperCase();
    if (firstName) return firstName.slice(0, 2).toUpperCase();
    if (username) return username.slice(0, 2).toUpperCase();
    return "??";
}

function Navbar() {
    const { pathname } = useLocation();
    const navigate = useNavigate();

    const [profile,  setProfile]  = useState(null);
    const [open,     setOpen]     = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        api.get("accounts/profile/")
            .then(r => setProfile(r.data))
            .catch(() => {});
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const handleLogout = () => {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        navigate("/login");
    };

    const initials    = profile ? avatarInitials(profile.first_name, profile.last_name, profile.username) : "…";
    const displayName = profile ? (profile.first_name || profile.username) : "…";
    const roleLabel   = profile ? (profile.role.charAt(0).toUpperCase() + profile.role.slice(1)) : "";
    const fullName    = profile ? `${profile.first_name} ${profile.last_name}`.trim() : "";

    return (
        <header className="navbar">

            {/* ── Page title ── */}
            <h1 className="page-title">{getTitle(pathname)}</h1>

            {/* ── Search ── */}
            <div className="navbar-center">
                <div className="search-box">
                    <FiSearch className="search-icon" />
                    <input type="text" placeholder="Search tickets, assets, users..." />
                </div>
            </div>

            {/* ── Right actions ── */}
            <div className="navbar-actions">

                <button className="nav-icon-btn" title="Help">
                    <FiHelpCircle />
                </button>

                <button className="nav-icon-btn notif-btn" title="Notifications">
                    <FiBell />
                    <span className="notif-badge">8</span>
                </button>

                <div className="nav-divider" />

                {/* ── Profile + Dropdown ── */}
                <div className="profile-wrapper" ref={dropdownRef}>
                    <div className="profile" onClick={() => setOpen(o => !o)}>
                        <div className="avatar">{initials}</div>
                        <div className="profile-info">
                            <span className="username">{displayName}</span>
                            <span className="role">{roleLabel}</span>
                        </div>
                        <FiChevronDown className={`chevron-icon${open ? " chevron-open" : ""}`} />
                    </div>

                    {open && (
                        <div className="profile-dropdown">
                            {/* User card */}
                            <div className="pd-card">
                                <div className="pd-avatar">{initials}</div>
                                <div className="pd-card-info">
                                    <p className="pd-name">{fullName || displayName}</p>
                                    <span className="pd-role-badge">{roleLabel}</span>
                                </div>
                            </div>

                            <div className="pd-divider" />

                            {/* Details */}
                            <div className="pd-details">
                                <div className="pd-row">
                                    <FiMail size={13} className="pd-row-icon" />
                                    <span>{profile?.email || "—"}</span>
                                </div>
                                <div className="pd-row">
                                    <FiUser size={13} className="pd-row-icon" />
                                    <span>@{profile?.username || "—"}</span>
                                </div>
                                <div className="pd-row">
                                    <FiShield size={13} className="pd-row-icon" />
                                    <span>{roleLabel}</span>
                                </div>
                            </div>

                            <div className="pd-divider" />

                            {/* Actions */}
                            <div className="pd-actions">
                                <button className="pd-action-btn" onClick={() => { navigate("/settings"); setOpen(false); }}>
                                    <FiSettings size={14} />
                                    Settings
                                </button>
                                <button className="pd-action-btn pd-logout-btn" onClick={handleLogout}>
                                    <FiLogOut size={14} />
                                    Logout
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
