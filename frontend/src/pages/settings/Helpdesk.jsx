import { FiPlus, FiSettings, FiClock, FiMail, FiUsers } from "react-icons/fi";
import "../settings/Settings.css";

const priorities = [
  { label: "Critical", desc: "Immediate action required for production outages.", bg: "#fee2e2", color: "#dc2626" },
  { label: "High",     desc: "Serious impact on workflow for multiple users.",     bg: "#0d9488", color: "#fff" },
  { label: "Medium",   desc: "Standard operational issues with available workarounds.", bg: "#eff6ff", color: "#2563eb" },
  { label: "Low",      desc: "General inquiries, minor bugs, and requests.",       bg: "#f3f4f6", color: "#6b7280" },
];

const slaPolicies = [
  { priority: "Critical", priorityColor: "#dc2626", response: "15m", resolution: "2h" },
  { priority: "High",     priorityColor: "#ea580c", response: "1h",  resolution: "8h" },
  { priority: "Medium",   priorityColor: "#2563eb", response: "4h",  resolution: "24h" },
  { priority: "Low",      priorityColor: "#6b7280", response: "8h",  resolution: "48h" },
];

const recentChanges = [
  { text: "SLA Response for Critical updated", meta: "1HOUR AGO BY SARAH M.", dot: "blue" },
  { text: "Modified Friday closing time",       meta: "YESTERDAY BY ADMIN",    dot: "gray" },
];

export default function Helpdesk() {
  return (
    <div className="st-page">
      <div className="st-main">
        <div>
          <h1 className="st-page-title">Helpdesk Settings</h1>
          <p className="st-page-sub">Configure your ticket priorities, service level agreements, and operational hours.</p>
        </div>

        {/* Priority Levels */}
        <div className="st-card">
          <div className="st-card-header">
            <h2 className="st-card-title"><FiSettings size={16} color="#2563eb" /> Priority Levels</h2>
            <button className="st-btn-secondary st-btn-sm"><FiPlus size={13} /> Add Level</button>
          </div>
          <div className="st-card-body">
            {priorities.map((p) => (
              <div key={p.label} className="st-priority-row">
                <span className="st-priority-badge" style={{ background: p.bg, color: p.color }}>{p.label}</span>
                <span className="st-priority-desc">{p.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SLA Policies */}
        <div className="st-card">
          <div className="st-card-header">
            <h2 className="st-card-title"><FiClock size={16} color="#2563eb" /> SLA Policies</h2>
            <span style={{ fontSize: 11, color: "#9ca3af" }}>Last updated: 2 days ago</span>
          </div>
          <div className="st-table-wrap">
            <table className="st-table">
              <thead>
                <tr>
                  <th>PRIORITY</th>
                  <th>RESPONSE TIME</th>
                  <th>RESOLUTION TIME</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {slaPolicies.map((s) => (
                  <tr key={s.priority}>
                    <td style={{ fontWeight: 700, color: s.priorityColor }}>{s.priority}</td>
                    <td>{s.response}</td>
                    <td>{s.resolution}</td>
                    <td><button className="st-icon-btn"><FiSettings size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Business Hours */}
        <div className="st-card">
          <div className="st-card-header">
            <h2 className="st-card-title"><FiClock size={16} color="#2563eb" /> Business Hours</h2>
            <button className="st-btn-secondary st-btn-sm"><FiSettings size={13} /> Edit Hours</button>
          </div>
          <div className="st-card-body">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 13, color: "#111827", margin: "0 0 2px" }}>Mon - Fri</p>
                <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>09:00 AM – 06:00 PM</p>
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: 13, color: "#9ca3af", margin: "0 0 2px" }}>Weekend</p>
                <p style={{ fontSize: 12, color: "#9ca3af", margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
                  ⊘ Closed
                </p>
              </div>
            </div>
            <div className="st-info-box">
              SLA timers are automatically paused outside of business hours unless "24/7 Overrides" are active for Critical priorities.{" "}
              <a href="#">View 24/7 Policy →</a>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="st-right">
        {/* System Compliance */}
        <div className="st-compliance-card">
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 15 }}>✓</span>
            <span style={{ fontSize: 13, fontWeight: 700 }}>System Compliance</span>
          </div>
          <p className="st-compliance-desc">All SLA and Priority rules are currently active and compliant with internal standards.</p>
          <div className="st-compliance-bar-bg">
            <div className="st-compliance-bar" style={{ width: "94%" }} />
          </div>
          <div className="st-compliance-footer">
            <span>SCORE: 94%</span>
            <span>TIER: GOLD</span>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="st-panel-card">
          <p className="st-panel-title">Quick Navigation</p>
          {[
            { Icon: FiMail,     label: "Email Templates" },
            { Icon: FiSettings, label: "Workflow Automation" },
            { Icon: FiUsers,    label: "Team Assignments" },
          ].map(({ Icon, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f3f4f6", fontSize: 13, color: "#374151", cursor: "pointer" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Icon size={14} color="#6b7280" />{label}</span>
              <span style={{ color: "#9ca3af" }}>›</span>
            </div>
          ))}
        </div>

        <div className="st-panel-card">
          <p className="st-panel-title">Recent Changes</p>
          <ul className="st-timeline">
            {recentChanges.map((c) => (
              <li key={c.text} className="st-timeline-item">
                <span className={`st-timeline-dot ${c.dot === "gray" ? "st-timeline-dot-gray" : ""}`} />
                <div className="st-timeline-text"><p>{c.text}</p><span>{c.meta}</span></div>
              </li>
            ))}
          </ul>
        </div>

        <div className="st-panel-card" style={{ border: "1.5px dashed #e5e7eb", textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 8px" }}>Need help with complex SLA logic?</p>
          <button style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "#2563eb", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
            ⊙ Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}
