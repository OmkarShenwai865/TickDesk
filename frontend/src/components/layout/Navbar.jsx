import { useLocation } from "react-router-dom";
import {
    FiBell,
    FiSearch,
    FiChevronDown,
    FiHelpCircle,
} from "react-icons/fi";

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
    // exact match first
    if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
    // ticket detail: /tickets/:id
    if (pathname.startsWith("/tickets/")) return "Ticket Detail";
    // any settings sub-page
    if (pathname.startsWith("/settings")) return "Settings";
    return "TickDesk";
}

function Navbar() {
    const { pathname } = useLocation();

    return (
        <header className="navbar">

            {/* ── Page title ── */}
            <h1 className="page-title">{getTitle(pathname)}</h1>

            {/* ── Search ── */}
            <div className="navbar-center">
                <div className="search-box">
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search tickets, assets, users..."
                    />
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

                <div className="profile">
                    <div className="avatar">OK</div>
                    <div className="profile-info">
                        <span className="username">Omkar</span>
                        <span className="role">Admin</span>
                    </div>
                    <FiChevronDown className="chevron-icon" />
                </div>

            </div>

        </header>
    );
}

export default Navbar;
