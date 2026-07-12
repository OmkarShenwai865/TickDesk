import { useState } from "react";
import {
  FiShield, FiKey, FiUsers, FiCheck, FiX,
  FiMoreVertical, FiPlus, FiActivity,
} from "react-icons/fi";
import "../settings/Settings.css";

// ── Static config data ────────────────────────────────────────────────────
const roles = [
  { icon: "A", iconBg: "#eff6ff", iconColor: "#2563eb",
    name: "Admin",         desc: "Full system access, billing, and user governance" },
  { icon: "S", iconBg: "#f0fdf4", iconColor: "#16a34a",
    name: "Support Agent", desc: "Manages tickets and assets within assigned departments" },
  { icon: "E", iconBg: "#faf5ff", iconColor: "#7c3aed",
    name: "Employee",      desc: "Standard user access for ticket submission and tracking" },
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

// const apiKeys = [ // unused while the API Keys section is hidden
//   { name: "Production Webhook",  status: "Active",  cls: "st-badge-green", created: "Oct 12, 2023" },
//   { name: "Staging Integration", status: "Active",  cls: "st-badge-green", created: "Nov 04, 2023" },
//   { name: "Legacy Reporter",     status: "Expired", cls: "st-badge-red",   created: "Jan 15, 2023" },
// ];

const securityActivity = [
  { text: "API Key Created",      meta: "New key 'Production Webhook' generated · 2h ago",  dot: "#6b7280" },
  { text: "Policy Updated",       meta: "Password complexity requirements increased · 6h ago", dot: "#6b7280" },
  { text: "Failed Login Attempt", meta: "IP 192.168.1.1 attempted from London · Yesterday",  dot: "#dc2626" },
];

export default function AccessSecurity() {
  // Hidden until Authentication & Access Policies / API Keys are backed by
  // a real endpoint — these toggles/selects currently don't persist anything.
  // const [tfa, setTfa]       = useState(true);
  // const [mfa, setMfa]       = useState(true);
  // const [defRole, setDefRole] = useState("Employee");
  // const [passPolicy, setPassPolicy] = useState("Min 8 characters");
  // const [sessionTimeout, setSessionTimeout] = useState("1 hour");
  // const [inviteExpiry, setInviteExpiry] = useState("48");

  return (
    <div className="st-page">
      <div className="st-main">
        {/* Header */}
        <div className="st-page-header">
          <div>
            <h1 className="st-page-title">Access & Security</h1>
            <p className="st-page-sub">
              Configure roles, permissions, and authentication policies in one place.
            </p>
          </div>
          <button className="st-btn-primary"><FiPlus size={14} /> Add Role</button>
        </div>

        {/* ── Section 1: Roles ─────────────────────────────────────────── */}
        <div className="st-card">
          <div className="st-card-header">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FiUsers size={16} color="#2563eb" />
              <h2 className="st-card-title" style={{ margin: 0 }}>Role Definitions</h2>
            </div>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>Assign members from the Users page</span>
          </div>
          <div className="st-table-wrap">
            <table className="st-table">
              <thead>
                <tr>
                  <th>ROLE</th>
                  <th>DESCRIPTION</th>
                  <th>STATUS</th>
                  <th></th>
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
                    <td><span className="st-badge st-badge-green">ACTIVE</span></td>
                    <td><button className="st-icon-btn"><FiMoreVertical size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Section 2: Permission Matrix ─────────────────────────────── */}
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
                          : <FiX size={14} color="#d1d5db" strokeWidth={2} />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Section 3: Auth & Access Policies ────────────────────────── */}
        {/* Hidden — these toggles/selects don't persist to any backend yet.
        <div className="st-card">
          <div className="st-card-header">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FiLock size={16} color="#2563eb" />
              <h2 className="st-card-title" style={{ margin: 0 }}>Authentication & Access Policies</h2>
            </div>
          </div>
          <div className="st-card-body">
            <div className="st-toggle-wrap">
              <div className="st-toggle-info">
                <p className="st-toggle-label">Two-Factor Authentication (2FA)</p>
                <p className="st-toggle-desc">Require all admins to use an authenticator app to sign in.</p>
              </div>
              <label className="st-toggle">
                <input type="checkbox" checked={tfa} onChange={() => setTfa(!tfa)} />
                <span className="st-toggle-slider" />
              </label>
            </div>
            <div className="st-toggle-wrap">
              <div className="st-toggle-info">
                <p className="st-toggle-label">Require MFA for all users</p>
                <p className="st-toggle-desc">Users must set up an authenticator before accessing the platform.</p>
              </div>
              <label className="st-toggle">
                <input type="checkbox" checked={mfa} onChange={() => setMfa(!mfa)} />
                <span className="st-toggle-slider" />
              </label>
            </div>

            <div className="st-form-grid" style={{ marginTop: 16 }}>
              <div className="st-field">
                <label>Password Policy</label>
                <div className="st-select-wrap">
                  <select className="st-select" value={passPolicy} onChange={e => setPassPolicy(e.target.value)}>
                    <option>Min 8 characters</option>
                    <option>Min 12 characters</option>
                    <option>Complex (upper, lower, symbol)</option>
                  </select>
                </div>
              </div>
              <div className="st-field">
                <label>Session Timeout</label>
                <div className="st-select-wrap">
                  <select className="st-select" value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)}>
                    <option>30 minutes</option>
                    <option>1 hour</option>
                    <option>4 hours</option>
                    <option>8 hours</option>
                  </select>
                </div>
              </div>
              <div className="st-field">
                <label>Default Role for New Users</label>
                <div className="st-select-wrap">
                  <select className="st-select" value={defRole} onChange={e => setDefRole(e.target.value)}>
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
        */}

        {/* ── Section 4: API Keys ───────────────────────────────────────── */}
        {/* Hidden — no real API-key infrastructure exists yet.
        <div className="st-card">
          <div className="st-card-header">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FiKey size={16} color="#2563eb" />
              <h2 className="st-card-title" style={{ margin: 0 }}>API Keys</h2>
            </div>
            <button className="st-btn-secondary st-btn-sm"><FiPlus size={13} /> Create API Key</button>
          </div>
          <div className="st-table-wrap">
            <table className="st-table">
              <thead>
                <tr>
                  <th>KEY NAME</th>
                  <th>STATUS</th>
                  <th>CREATED</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((k) => (
                  <tr key={k.name}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 7, background: "#f0f7ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <FiKey size={13} color="#2563eb" />
                        </div>
                        <span style={{ fontWeight: 500, color: "#111827" }}>{k.name}</span>
                      </div>
                    </td>
                    <td><span className={`st-badge ${k.cls}`}>{k.status}</span></td>
                    <td style={{ color: "#6b7280" }}>{k.created}</td>
                    <td><button className="st-icon-btn"><FiMoreVertical size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "12px 20px", borderTop: "1px solid #f3f4f6", textAlign: "center" }}>
            <button style={{ fontSize: 12, color: "#2563eb", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
              View API documentation →
            </button>
          </div>
        </div>
        */}
      </div>

      {/* ── Right panel ──────────────────────────────────────────────────── */}
      <div className="st-right">
        {/* Quick Actions */}
        <div className="st-panel-card">
          <p className="st-panel-title">Quick Actions</p>
          <button className="st-qa-item">
            <FiPlus size={14} color="#2563eb" />
            <div>
              <div style={{ fontWeight: 600 }}>Add Role</div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>Create a new access level</div>
            </div>
          </button>
          <button className="st-qa-item">
            <FiKey size={14} color="#2563eb" />
            <div>
              <div style={{ fontWeight: 600 }}>Create API Key</div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>Generate integration key</div>
            </div>
          </button>
          <button className="st-qa-item">
            <FiActivity size={14} color="#2563eb" />
            <div>
              <div style={{ fontWeight: 600 }}>View Audit Logs</div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>Full access history</div>
            </div>
          </button>
        </div>

        {/* Security Health */}
        <div className="st-panel-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <p className="st-panel-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
              <FiShield size={13} color="#2563eb" /> SECURITY HEALTH
            </p>
            <span className="st-dot st-dot-green" />
          </div>
          {[
            { label: "Identity Service", val: "Operational",   color: "#16a34a" },
            { label: "Auth Proxy",       val: "Operational",   color: "#16a34a" },
            { label: "Directory Sync",   val: "Stable (14ms)", color: "#2563eb" },
          ].map((s) => (
            <div key={s.label} className="st-status-row">
              <span className="st-status-label">{s.label}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.val}</span>
            </div>
          ))}
          <div className="st-bar-bg" style={{ marginTop: 10 }}>
            <div className="st-bar" style={{ width: "99.9%", background: "#16a34a" }} />
          </div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", color: "#9ca3af", margin: "6px 0 0" }}>
            99.9% UPTIME LAST 30 DAYS
          </p>
        </div>

        {/* Security Activity */}
        <div className="st-panel-card">
          <p className="st-panel-title">Security Activity</p>
          <ul className="st-timeline">
            {securityActivity.map((a) => (
              <li key={a.text} className="st-timeline-item">
                <span className="st-timeline-dot" style={{ background: a.dot, borderColor: a.dot + "33" }} />
                <div className="st-timeline-text">
                  <p>{a.text}</p>
                  <span>{a.meta}</span>
                </div>
              </li>
            ))}
          </ul>
          <button style={{ fontSize: 12, color: "#2563eb", fontWeight: 600, background: "none", border: "none", cursor: "pointer", marginTop: 10, padding: 0 }}>
            View all activity →
          </button>
        </div>

        {/* Security tip */}
        <div className="st-tip-card">
          <div style={{ fontSize: 18 }}>💡</div>
          <div className="st-tip-text">
            <p><strong>Security Tip</strong></p>
            <p>Hardware security keys reduce phishing risk by up to 99% compared to standard 2FA apps.</p>
            <a href="#">Learn more</a>
          </div>
        </div>
      </div>
    </div>
  );
}
