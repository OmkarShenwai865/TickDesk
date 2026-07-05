import { useState } from "react";
import { FiShield, FiMoreVertical, FiPlus, FiCheck, FiX } from "react-icons/fi";
import "../settings/Settings.css";

// ── Configuration data (not live user data) ───────────────────────────────
const roles = [
  { icon: "A", iconBg: "#eff6ff", iconColor: "#2563eb",
    name: "Admin",         desc: "Full system access, billing, and user governance",            status: "ACTIVE" },
  { icon: "S", iconBg: "#f0fdf4", iconColor: "#16a34a",
    name: "Support Agent", desc: "Manages tickets and assets within assigned departments",       status: "ACTIVE" },
  { icon: "E", iconBg: "#faf5ff", iconColor: "#7c3aed",
    name: "Employee",      desc: "Standard user access for ticket submission and tracking",      status: "ACTIVE" },
];

const permissions = [
  { label: "View Dashboard",      admin: true,  agent: true,  emp: true  },
  { label: "Submit Tickets",      admin: true,  agent: true,  emp: true  },
  { label: "Manage Tickets",      admin: true,  agent: true,  emp: false },
  { label: "Manage Assets",       admin: true,  agent: true,  emp: false },
  { label: "Manage Users",        admin: true,  agent: false, emp: false },
  { label: "Access Settings",     admin: true,  agent: false, emp: false },
  { label: "Generate Reports",    admin: true,  agent: true,  emp: false },
  { label: "View Knowledge Base", admin: true,  agent: true,  emp: true  },
];

const recentChanges = [
  { text: 'Role "Admin" updated',  meta: "by Sarah Miller • 2h ago", dot: "blue" },
  { text: "MFA policy enabled",    meta: "by Admin • 5h ago",         dot: "gray" },
  { text: "New role permissions",  meta: "by API Hook • Yesterday",   dot: "gray" },
];

export default function UserManagement() {
  const [mfa, setMfa] = useState(true);
  const [defaultRole, setDefaultRole] = useState("Employee");
  const [inviteExpiry, setInviteExpiry] = useState("48");

  return (
    <div className="st-page">
      <div className="st-main">
        {/* Header */}
        <div className="st-page-header">
          <div>
            <h1 className="st-page-title">User Management</h1>
            <p className="st-page-sub">Configure roles, permissions, and access policies. To manage individual users go to the <strong>Users</strong> page.</p>
          </div>
          <button className="st-btn-primary"><FiPlus size={14} /> Add Role</button>
        </div>

        {/* Role Definitions */}
        <div className="st-card">
          <div className="st-card-header">
            <div>
              <h2 className="st-card-title">Role Definitions</h2>
              <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0" }}>
                Define the roles available in your organisation. Assign members from the Users page.
              </p>
            </div>
          </div>
          <div className="st-table-wrap">
            <table className="st-table">
              <thead>
                <tr>
                  <th>ROLE</th>
                  <th>DESCRIPTION</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => (
                  <tr key={r.name}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: r.iconBg, color: r.iconColor,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 700, flexShrink: 0,
                        }}>{r.icon}</div>
                        <span style={{ fontWeight: 600, color: "#111827" }}>{r.name}</span>
                      </div>
                    </td>
                    <td style={{ color: "#6b7280" }}>{r.desc}</td>
                    <td><span className="st-badge st-badge-green">{r.status}</span></td>
                    <td><button className="st-icon-btn"><FiMoreVertical size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Permission Matrix */}
        <div className="st-card">
          <div className="st-card-header">
            <h2 className="st-card-title">Permission Matrix</h2>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>What each role can do</span>
          </div>
          <div className="st-table-wrap">
            <table className="st-table">
              <thead>
                <tr>
                  <th>PERMISSION</th>
                  <th style={{ textAlign: "center" }}>ADMIN</th>
                  <th style={{ textAlign: "center" }}>SUPPORT AGENT</th>
                  <th style={{ textAlign: "center" }}>EMPLOYEE</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map((row) => (
                  <tr key={row.label}>
                    <td style={{ fontWeight: 500, color: "#374151" }}>{row.label}</td>
                    {[row.admin, row.agent, row.emp].map((v, i) => (
                      <td key={i} style={{ textAlign: "center" }}>
                        {v
                          ? <FiCheck size={15} color="#16a34a" strokeWidth={2.5} />
                          : <FiX size={14} color="#d1d5db" strokeWidth={2} />
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Access Policies */}
        <div className="st-card">
          <div className="st-card-header">
            <h2 className="st-card-title"><FiShield size={15} color="#2563eb" /> Access Policies</h2>
          </div>
          <div className="st-card-body">
            {/* MFA */}
            <div className="st-toggle-wrap">
              <div className="st-toggle-info">
                <p className="st-toggle-label">Require MFA for all users</p>
                <p className="st-toggle-desc">Users must set up an authenticator app before accessing the platform.</p>
              </div>
              <label className="st-toggle">
                <input type="checkbox" checked={mfa} onChange={() => setMfa(!mfa)} />
                <span className="st-toggle-slider" />
              </label>
            </div>

            <div className="st-form-grid" style={{ marginTop: 16 }}>
              <div className="st-field">
                <label>Default Role for New Users</label>
                <div className="st-select-wrap">
                  <select className="st-select" value={defaultRole} onChange={e => setDefaultRole(e.target.value)}>
                    <option>Employee</option>
                    <option>Support Agent</option>
                    <option>Admin</option>
                  </select>
                </div>
              </div>
              <div className="st-field">
                <label>Invitation Link Expiry</label>
                <div className="st-select-wrap">
                  <select className="st-select" value={inviteExpiry} onChange={e => setInviteExpiry(e.target.value)}>
                    <option value="24">24 hours</option>
                    <option value="48">48 hours</option>
                    <option value="72">72 hours</option>
                    <option value="168">7 days</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="st-form-footer">
              <button className="st-btn-secondary">Cancel</button>
              <button className="st-btn-primary">Save Policies</button>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="st-right">
        <div className="st-panel-card">
          <p className="st-panel-title">About This Page</p>
          <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6, margin: 0 }}>
            Settings here control <strong>how roles work</strong> and what policies apply to all users.
            To add, edit, or remove individual users visit the{" "}
            <a href="/users" style={{ color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>Users page →</a>
          </p>
        </div>

        <div className="st-panel-dark">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <p className="st-panel-title" style={{ margin: 0 }}>DIRECTORY STATUS</p>
            <span className="st-dot st-dot-green" />
          </div>
          <div className="st-dark-status-row">
            <span className="st-dark-label">Directory Sync</span>
            <span className="st-dark-value" style={{ color: "#60a5fa" }}>Operational</span>
          </div>
          <div className="st-dark-bar-bg"><div className="st-dark-bar" style={{ width: "92%" }} /></div>
          <div className="st-dark-status-row">
            <span className="st-dark-label">LDAP Connection</span>
            <span className="st-dark-value" style={{ color: "#34d399" }}>Stable (14ms)</span>
          </div>
        </div>

        <div className="st-panel-card">
          <p className="st-panel-title">Recent Changes</p>
          <ul className="st-timeline">
            {recentChanges.map((c) => (
              <li key={c.text} className="st-timeline-item">
                <span className={`st-timeline-dot ${c.dot === "gray" ? "st-timeline-dot-gray" : ""}`} />
                <div className="st-timeline-text">
                  <p>{c.text}</p>
                  <span>{c.meta}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
