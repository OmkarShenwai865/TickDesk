import { useState } from "react";
import { FiPlus, FiFileText, FiMail, FiAlertTriangle } from "react-icons/fi";
import "../settings/Settings.css";

const toggleItems = [
  {
    label: "Email Notifications",
    desc: "Weekly digest and critical status updates.",
    key: "email",
    on: true,
  },
  {
    label: "In-App Notifications",
    desc: "Real-time alerts within the TickDesk dashboard.",
    key: "inapp",
    on: true,
  },
  {
    label: "System Alerts",
    desc: "Automated technical logs and performance warnings.",
    key: "system",
    on: false,
  },
];

const templates = [
  { Icon: FiFileText, name: "Ticket Created",  status: "ACTIVE", badgeCls: "st-badge-green" },
  { Icon: FiMail,     name: "Ticket Updated",  status: "ACTIVE", badgeCls: "st-badge-green" },
  { Icon: FiMail,     name: "Password Reset",  status: "DRAFT",  badgeCls: "st-badge-gray" },
  { Icon: FiFileText, name: "Asset Assigned",  status: "ACTIVE", badgeCls: "st-badge-green" },
];

const upcoming = [
  { label: "Weekly Backup Digest",  time: "Fri, 6 PM" },
  { label: "Asset Audit Reminder",  time: "Mon, 9 AM" },
];

export default function Notifications() {
  const [toggles, setToggles] = useState(
    Object.fromEntries(toggleItems.map((t) => [t.key, t.on]))
  );

  return (
    <div className="st-page">
      <div className="st-main">
        <div>
          <h1 className="st-page-title">Notification Settings</h1>
          <p className="st-page-sub">Configure how and when you want to be alerted across the enterprise platform.</p>
        </div>

        <div className="st-notif-two-col">
          {/* Global Notifications */}
          <div className="st-card">
            <div className="st-card-header">
              <h2 className="st-card-title" style={{ fontSize: 14 }}>
                <FiAlertTriangle size={15} color="#2563eb" /> Global Notifications
              </h2>
            </div>
            <div className="st-card-body">
              {toggleItems.map((t) => (
                <div key={t.key} className="st-toggle-wrap">
                  <div className="st-toggle-info">
                    <p className="st-toggle-label">{t.label}</p>
                    <p className="st-toggle-desc">{t.desc}</p>
                  </div>
                  <label className="st-toggle">
                    <input
                      type="checkbox"
                      checked={toggles[t.key]}
                      onChange={() =>
                        setToggles((prev) => ({ ...prev, [t.key]: !prev[t.key] }))
                      }
                    />
                    <span className="st-toggle-slider" />
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Email Templates */}
          <div className="st-card">
            <div className="st-card-header">
              <h2 className="st-card-title" style={{ fontSize: 14 }}>
                <FiMail size={15} color="#2563eb" /> Email Templates
              </h2>
              <button className="st-btn-secondary st-btn-sm"><FiPlus size={13} /> New Template</button>
            </div>
            <div className="st-card-body" style={{ padding: 0 }}>
              <table className="st-table">
                <thead>
                  <tr>
                    <th>TEMPLATE NAME</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((t) => (
                    <tr key={t.name}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <t.Icon size={14} color="#6b7280" />
                          <span style={{ fontSize: 13, color: "#374151" }}>{t.name}</span>
                        </div>
                      </td>
                      <td><span className={`st-badge ${t.badgeCls}`}>{t.status}</span></td>
                      <td><button className="st-btn-secondary st-btn-sm">Edit</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: "12px 16px", textAlign: "center", borderTop: "1px solid #f3f4f6" }}>
                <button style={{ fontSize: 12, color: "#2563eb", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
                  View All 10 Templates →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Analytics */}
        <div style={{ background: "linear-gradient(135deg,#1e40af,#2563eb)", borderRadius: 12, padding: "18px 22px", color: "#fff" }}>
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>Notification Analytics</p>
          <p style={{ fontSize: 13, opacity: 0.85, margin: "0 0 14px" }}>
            You've received 142 alerts this week, mostly related to Asset Inventory.
          </p>
          <button style={{ padding: "7px 16px", background: "rgba(255,255,255,0.2)", border: "1.5px solid rgba(255,255,255,0.4)", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            View Report
          </button>
        </div>
      </div>

      {/* Right panel */}
      <div className="st-right">
        <div className="st-panel-card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <FiMail size={14} color="#2563eb" />
            <p className="st-panel-title" style={{ margin: 0 }}>SMTP Server Status</p>
          </div>
          <span className="st-badge st-badge-green" style={{ marginBottom: 6 }}>OPERATIONAL</span>
          <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>Latency: 42ms</p>
        </div>

        <div className="st-panel-card">
          <p className="st-panel-title">Queue Thresholds</p>
          <p style={{ fontSize: 12, color: "#6b7280", margin: 0, lineHeight: 1.6 }}>
            Average queue wait time is currently <strong style={{ color: "#111827" }}>2.4 seconds</strong>.
          </p>
        </div>

        <div className="st-panel-card">
          <p className="st-panel-title">UPCOMING ALERTS</p>
          {upcoming.map((u) => (
            <div key={u.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f3f4f6", fontSize: 12 }}>
              <span style={{ color: "#374151", display: "flex", alignItems: "center", gap: 5 }}>
                ⏰ {u.label}
              </span>
              <span style={{ color: "#9ca3af" }}>{u.time}</span>
            </div>
          ))}
        </div>

        <div className="st-panel-card">
          <p style={{ fontSize: 12, fontWeight: 600, color: "#111827", margin: "0 0 6px" }}>Need help?</p>
          <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 8px", lineHeight: 1.5 }}>
            Read our guide on setting up custom SMTP servers and notification groups.
          </p>
          <a href="#" style={{ fontSize: 12, color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>Documentation ↗</a>
        </div>
      </div>
    </div>
  );
}
