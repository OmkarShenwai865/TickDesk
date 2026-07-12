import { NavLink, useNavigate } from "react-router-dom";
import logoIcon from "../../assets/logo-icon.png";

import {
    FiGrid,
    FiBox,
    FiClipboard,
    FiUsers,
    FiLayers,
    FiBarChart2,
    FiBookOpen,
    FiUser,
    FiSettings,
    FiLogOut,
    FiGlobe,
    FiSend,
} from "react-icons/fi";

import "./Sidebar.css";

const menuItems = [
    { name: "Dashboard",    path: "/dashboard",    icon: FiGrid,     roles: ["admin"] },
    { name: "Assets",       path: "/assets",       icon: FiBox,      roles: ["admin", "agent"] },
    { name: "My Assets",   path: "/assets?my_assets=1", icon: FiBox, roles: ["employee"] },
    { name: "Tickets",      path: "/tickets",      icon: FiClipboard,roles: ["admin", "agent", "employee"] },
    { name: "Users",        path: "/users",        icon: FiUsers,    roles: ["admin"] },
    { name: "Departments",  path: "/departments",  icon: FiLayers,   roles: ["admin"] },
    { name: "Reports",      path: "/reports",      icon: FiBarChart2,roles: ["admin", "agent"] },
    { name: "Knowledge Base",path: "/knowledge-base",icon: FiBookOpen,roles: ["admin", "agent", "employee"] },
    { name: "Dashboard",      path: "/platform",               icon: FiGrid,      roles: ["superadmin"] },
    { name: "Companies",      path: "/platform/companies",     icon: FiGlobe,     roles: ["superadmin"] },
    { name: "Announcements",  path: "/platform/announcements", icon: FiSend,      roles: ["superadmin"] },
    { name: "Reports",        path: "/platform/reports",       icon: FiBarChart2, roles: ["superadmin"] },
    { name: "Profile",      path: "/profile",      icon: FiUser,     roles: ["agent", "employee", "superadmin"] },
    { name: "Settings",     path: "/settings",     icon: FiSettings, roles: ["admin"] },
];

function Sidebar() {
    const navigate = useNavigate();
    const role = localStorage.getItem("role") || "employee";
    const visibleMenuItems = menuItems.filter(item => item.roles.includes(role));

    const handleLogout = () => {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("role");
        navigate("/");
    };

    return (
        <aside className="sidebar">

            {/* ---------- Logo ---------- */}

            <div className="sidebar-logo">

                <div className="logo-header">

                    <img
                        src={logoIcon}
                        alt="TickDesk Logo"
                        className="logo-icon"
                    />

                    <div className="logo-text">

                        <h2>TickDesk</h2>

                        <p className="logo-tagline">
                            IT Helpdesk & Asset Management
                        </p>

                    </div>

                </div>

            </div>

            {/* ---------- Navigation ---------- */}

            <nav className="sidebar-nav">

                <ul className="sidebar-menu">

                    {visibleMenuItems.map((item) => {

                        const Icon = item.icon;

                        return (
                            <li key={item.path}>

                                <NavLink
                                    to={item.path}
                                    end={item.path === "/platform"}
                                    className={({ isActive }) =>
                                        isActive
                                            ? "nav-link active"
                                            : "nav-link"
                                    }
                                >

                                    <Icon className="nav-icon" />

                                    <span>{item.name}</span>

                                </NavLink>

                            </li>
                        );

                    })}

                </ul>

            </nav>

            {/* ---------- Footer ---------- */}

            <div className="sidebar-footer">

                <button
                    className="logout-btn"
                    onClick={handleLogout}
                >

                    <FiLogOut className="nav-icon" />

                    <span>Logout</span>

                </button>

            </div>

        </aside>
    );
}

export default Sidebar;
