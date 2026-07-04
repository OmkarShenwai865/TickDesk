import {
    FiBell,
    FiSearch,
    FiChevronDown,
    FiHelpCircle,
} from "react-icons/fi";

import "./Navbar.css";

function Navbar() {
    return (
        <header className="navbar">

            {/* ── Page title ── */}
            <h1 className="page-title">Dashboard</h1>

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
