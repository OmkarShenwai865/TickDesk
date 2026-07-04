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
    FiSettings,
    FiLogOut,
} from "react-icons/fi";

import "./Sidebar.css";

const menuItems = [
    {
        name: "Dashboard",
        path: "/dashboard",
        icon: FiGrid,
    },
    {
        name: "Assets",
        path: "/assets",
        icon: FiBox,
    },
    {
        name: "Tickets",
        path: "/tickets",
        icon: FiClipboard,
    },
    {
        name: "Users",
        path: "/users",
        icon: FiUsers,
    },
    {
        name: "Departments",
        path: "/departments",
        icon: FiLayers,
    },
    {
        name: "Reports",
        path: "/reports",
        icon: FiBarChart2,
    },
    {
        name: "Knowledge Base",
        path: "/knowledge-base",
        icon: FiBookOpen,
    },
    {
        name: "Settings",
        path: "/settings",
        icon: FiSettings,
    },
];

function Sidebar() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
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

                    {menuItems.map((item) => {

                        const Icon = item.icon;

                        return (
                            <li key={item.path}>

                                <NavLink
                                    to={item.path}
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