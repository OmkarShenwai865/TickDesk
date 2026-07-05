import { NavLink, Outlet } from "react-router-dom";
import {
  FiGrid, FiShield, FiHeadphones, FiBell, FiSettings,
} from "react-icons/fi";
import "./Settings.css";

const NAV = [
  { path: "/settings/general",          label: "General",            Icon: FiGrid },
  { path: "/settings/access-security",  label: "Access & Security",  Icon: FiShield },
  { path: "/settings/helpdesk",         label: "Helpdesk",           Icon: FiHeadphones },
  { path: "/settings/notifications",    label: "Notifications",      Icon: FiBell },
  { path: "/settings/system",           label: "System",             Icon: FiSettings },
];

export default function Settings() {
  return (
    <div className="st-shell">
      {/* Horizontal top tab bar */}
      <nav className="st-topnav">
        <div className="st-topnav-inner">
          <div className="st-topnav-tabs">
            {NAV.map(({ path, label, Icon }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  "st-topnav-tab" + (isActive ? " st-topnav-active" : "")
                }
              >
                <Icon size={13} />
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
      <div className="st-content">
        <Outlet />
      </div>
    </div>
  );
}
