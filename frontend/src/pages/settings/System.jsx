import { useState } from "react";
import {
  FiDownload, FiServer, FiDatabase,
  FiMonitor, FiPrinter, FiWifi, FiHardDrive, FiPlus,
} from "react-icons/fi";
import "../settings/Settings.css";

const auditTrail = [
  { text: "Config updated by Admin_Sarah",   dot: "#2563eb" },
  { text: "Failed login attempt (root)",     dot: "#dc2626" },
  { text: "Automatic backup completed",      dot: "#9ca3af" },
  { text: "System restarted",               dot: "#2563eb" },
];

const assetCategories = [
  { Icon: FiMonitor,   label: "Laptop",     units: 124 },
  { Icon: FiMonitor,   label: "Desktop",    units: 56  },
  { Icon: FiPrinter,   label: "Printer",    units: 12  },
  { Icon: FiWifi,      label: "Networking", units: 8   },
  { Icon: FiServer,    label: "Server",     units: 4   },
  { Icon: FiHardDrive, label: "Monitor",    units: 89  },
];

const lifecycle = [
  { label: "Available",   desc: "Ready for new assignments",           bar: "#16a34a", badge: "ACTIVE",   badgeCls: "st-badge-green"  },
  { label: "Assigned",    desc: "Currently with a user or department", bar: "#2563eb", badge: "PRIMARY",  badgeCls: "st-badge-blue"   },
  { label: "Maintenance", desc: "Repairing or software updates",       bar: "#f97316", badge: "PAUSED",   badgeCls: "st-badge-orange" },
  { label: "Retired",     desc: "Decommissioned or recycled",          bar: "#9ca3af", badge: "ARCHIVED", badgeCls: "st-badge-gray"   },
];

export default function System() {
  const [maintenance, setMaintenance] = useState(false);

  return (
    <div className="st-page">
      <div className="st-main">
        <div className="st-page-header">
          <div>
            <h1 className="st-page-title">System Settings</h1>
            <p className="st-page-sub">Configure core platform behavior, maintenance, and asset configuration.</p>
          </div>
          <button className="st-btn-secondary">
            <FiDownload size={14} /> Export Config
          </button>
        </div>

        {/* Two-col row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {/* System Information */}
          <div className="st-card">
            <div className="st-card-header">
              <h2 className="st-card-title" style={{ fontSize: 14 }}>
                <span style={{ fontSize: 15 }}>ⓘ</span> System Information
              </h2>
            </div>
            <div className="st-card-body">
              {[
                { label: "App Version", val: "v1.0.0", tag: true },
                { label: "Backend",     val: "Online",  color: "#16a34a" },
                { label: "Database",    val: "Connected", symbol: "✓", color: "#2563eb" },
              ].map((r) => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <span style={{ fontSize: 13, color: "#374151" }}>{r.label}</span>
                  {r.tag ? (
                    <span style={{ background: "#f3f4f6", padding: "2px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, color: "#374151" }}>{r.val}</span>
                  ) : (
                    <span style={{ fontSize: 13, fontWeight: 600, color: r.color }}>
                      {r.symbol} {r.val}
                    </span>
                  )}
                </div>
              ))}
              <div style={{ paddingTop: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: "#374151" }}>Storage Used</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>68%</span>
                </div>
                <div className="st-bar-bg"><div className="st-bar" style={{ width: "68%", background: "#2563eb" }} /></div>
              </div>
            </div>
          </div>

          {/* Maintenance */}
          <div className="st-card">
            <div className="st-card-header">
              <h2 className="st-card-title" style={{ fontSize: 14 }}>
                <span style={{ fontSize: 15 }}>🔧</span> Maintenance
              </h2>
              <label className="st-toggle">
                <input type="checkbox" checked={maintenance} onChange={() => setMaintenance(!maintenance)} />
                <span className="st-toggle-slider" />
              </label>
            </div>
            <div className="st-card-body">
              {maintenance && (
                <div style={{ background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 10, padding: 12, marginBottom: 14 }}>
                  <p style={{ fontSize: 12, color: "#dc2626", margin: 0, lineHeight: 1.6 }}>
                    ⚠ Enabling Maintenance Mode will disconnect all active user sessions and prevent new logins. Only administrators with bypass keys can enter the platform.
                  </p>
                </div>
              )}
              {!maintenance && (
                <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6, marginBottom: 14 }}>
                  Enable maintenance mode to perform system updates without user interference.
                </p>
              )}
              <button className="st-btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
                <FiDownload size={14} /> Download System Logs
              </button>
            </div>
          </div>
        </div>

        {/* Bottom cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {/* Performance Index */}
          <div className="st-card">
            <div className="st-card-body" style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#9ca3af", margin: "0 0 4px" }}>PERFORMANCE INDEX</p>
                <p style={{ fontSize: 28, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>98.4</p>
                <p style={{ fontSize: 12, color: "#16a34a", fontWeight: 600, margin: 0 }}>+0.2% vs last week</p>
              </div>
              <div style={{ width: 60, height: 60, borderRadius: "50%", border: "4px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 22, color: "#d1d5db" }}>⊙</span>
              </div>
            </div>
          </div>

          {/* Last Backup */}
          <div style={{ background: "linear-gradient(135deg,#1e3a5f,#2563eb)", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FiDatabase size={20} color="#fff" />
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", margin: 0 }}>Last Backup</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>14m ago</p>
          </div>
        </div>
        {/* ── Asset Configuration ───────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0 0" }}>
          <hr className="st-divider" style={{ flex: 1, margin: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>ASSET CONFIGURATION</span>
          <hr className="st-divider" style={{ flex: 1, margin: 0 }} />
        </div>

        {/* Asset Categories */}
        <div className="st-card">
          <div className="st-card-header">
            <h2 className="st-card-title">Asset Categories</h2>
            <button className="st-btn-primary st-btn-sm"><FiPlus size={13} /> Add Category</button>
          </div>
          <div className="st-card-body">
            <div className="st-cat-grid">
              {assetCategories.map(({ Icon, label, units }) => (
                <div key={label} className="st-cat-item">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Icon size={22} color="#6b7280" />
                    <span className="st-cat-units">{units} Units</span>
                  </div>
                  <p className="st-cat-name">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Asset Lifecycle Stages */}
        <div className="st-card">
          <div className="st-card-header">
            <h2 className="st-card-title">Asset Lifecycle Stages</h2>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>Workflow state definitions</span>
          </div>
          <div className="st-card-body">
            {lifecycle.map((l) => (
              <div key={l.label} className="st-lc-row">
                <div className="st-lc-left">
                  <div className="st-lc-bar" style={{ background: l.bar }} />
                  <div>
                    <p className="st-lc-name">{l.label}</p>
                    <p className="st-lc-desc">{l.desc}</p>
                  </div>
                </div>
                <span className={`st-badge ${l.badgeCls}`}>{l.badge}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="st-right">
        {/* Infrastructure Health */}
        <div className="st-panel-card">
          <p className="st-panel-title" style={{ fontSize: 10, letterSpacing: "0.08em", color: "#9ca3af" }}>INFRASTRUCTURE HEALTH</p>
          {[
            { Icon: FiServer,   label: "US-East Node", val: "99.9%", bar: 99.9 },
            { Icon: FiDatabase, label: "DB Cluster",   val: "Healthy", bar: 100 },
          ].map(({ Icon, label, val, bar }) => (
            <div key={label} className="st-infra-row">
              <div className="st-infra-icon"><Icon size={14} color="#2563eb" /></div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span className="st-infra-label">{label}</span>
                  <span className="st-infra-val">{val}</span>
                </div>
                <div className="st-bar-bg" style={{ marginTop: 0 }}>
                  <div className="st-bar" style={{ width: `${bar}%`, background: "#16a34a" }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Audit Trail */}
        <div className="st-panel-card">
          <p className="st-panel-title" style={{ fontSize: 10, letterSpacing: "0.08em", color: "#9ca3af" }}>AUDIT TRAIL</p>
          <ul className="st-timeline">
            {auditTrail.map((a) => (
              <li key={a.text} className="st-timeline-item">
                <span className="st-timeline-dot" style={{ background: a.dot, borderColor: a.dot + "33" }} />
                <div className="st-timeline-text"><p>{a.text}</p></div>
              </li>
            ))}
          </ul>
          <button style={{ fontSize: 12, color: "#2563eb", fontWeight: 600, background: "none", border: "none", cursor: "pointer", marginTop: 8 }}>
            View all activity →
          </button>
        </div>

        {/* Enterprise support */}
        <div style={{ background: "#2563eb", borderRadius: 12, padding: 16, color: "#fff" }}>
          <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 6px" }}>Enterprise Support</p>
          <p style={{ fontSize: 12, opacity: 0.85, margin: "0 0 12px", lineHeight: 1.5 }}>
            Need specialized assistance with your infrastructure? Our 24/7 team is ready.
          </p>
          <button style={{ width: "100%", padding: "7px", border: "1.5px solid rgba(255,255,255,0.5)", borderRadius: 8, background: "transparent", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Get Help
          </button>
        </div>
      </div>
    </div>
  );
}
