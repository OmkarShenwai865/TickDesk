import { FiPlus, FiMonitor, FiServer, FiPrinter, FiWifi, FiHardDrive } from "react-icons/fi";
import "../settings/Settings.css";

const categories = [
  { Icon: FiMonitor,   label: "Laptop",     units: 124 },
  { Icon: FiMonitor,   label: "Desktop",    units: 56  },
  { Icon: FiPrinter,   label: "Printer",    units: 12  },
  { Icon: FiWifi,      label: "Networking", units: 8   },
  { Icon: FiServer,    label: "Server",     units: 4   },
  { Icon: FiHardDrive, label: "Monitor",    units: 89  },
];

const lifecycle = [
  { label: "Available",    desc: "Ready for new assignments",           bar: "#16a34a", badge: "ACTIVE",   badgeCls: "st-badge-green" },
  { label: "Assigned",     desc: "Currently with a user or department", bar: "#2563eb", badge: "PRIMARY",  badgeCls: "st-badge-blue" },
  { label: "Maintenance",  desc: "Repairing or software updates",       bar: "#f97316", badge: "PAUSED",   badgeCls: "st-badge-orange" },
  { label: "Retired",      desc: "Decommissioned or recycled",          bar: "#9ca3af", badge: "ARCHIVED", badgeCls: "st-badge-gray" },
];

const recentActivity = [
  { dot: "#2563eb", text: "MacBook Pro Assigned",         meta: "To: Sarah Jenkins (Design)\n2 mins ago" },
  { dot: "#9ca3af", text: "Maintenance Log",              meta: "Server R4 – UPS Battery Replace\n1 hour ago" },
  { dot: "#dc2626", text: "Asset Retired",                meta: "HP LaserJet 402n (Old Office)\n5 hours ago" },
  { dot: "#2563eb", text: "New Assets Detected",          meta: "12x Dell U2723QE Monitors\nYesterday" },
];

export default function AssetManagement() {
  return (
    <div className="st-page">
      <div className="st-main">
        <div>
          <h1 className="st-page-title">Asset Management</h1>
          <p className="st-page-sub">Configure your hardware ecosystem and lifecycle workflows.</p>
        </div>

        {/* Asset Categories */}
        <div className="st-card">
          <div className="st-card-header">
            <h2 className="st-card-title">
              <span style={{ fontSize: 16 }}>⎇</span> Asset Categories
            </h2>
            <button className="st-btn-primary st-btn-sm"><FiPlus size={13} /> Add Category</button>
          </div>
          <div className="st-card-body">
            <div className="st-cat-grid">
              {categories.map(({ Icon, label, units }) => (
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

        {/* Asset Lifecycle */}
        <div className="st-card">
          <div className="st-card-header">
            <h2 className="st-card-title">
              <span style={{ fontSize: 16 }}>↻</span> Asset Lifecycle
            </h2>
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
        <div className="st-panel-card">
          <p className="st-panel-title">Analytics Overview</p>
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: "#374151" }}>Utilization Rate</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#16a34a" }}>+4.2%</span>
            </div>
            <div className="st-bar-bg"><div className="st-bar" style={{ width: "82%", background: "#2563eb" }} /></div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>82%</span>
              <span style={{ fontSize: 11, color: "#9ca3af" }}>291/355 active</span>
            </div>
          </div>
          <hr className="st-divider" style={{ margin: "10px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: 12, color: "#374151", margin: "0 0 4px" }}>Maintenance Health</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: 0 }}>94.8%</p>
              <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>4 devices require attention</p>
            </div>
            <span style={{ fontSize: 18 }}>⚠</span>
          </div>
        </div>

        <div className="st-panel-card">
          <p className="st-panel-title">Recent Activity</p>
          <ul className="st-timeline">
            {recentActivity.map((a) => (
              <li key={a.text} className="st-timeline-item">
                <span className="st-timeline-dot" style={{ background: a.dot, borderColor: a.dot + "33" }} />
                <div className="st-timeline-text">
                  <p>{a.text}</p>
                  {a.meta.split("\n").map((m, i) => <span key={i} style={{ display: "block" }}>{m}</span>)}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="st-panel-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Export Config</span>
          <span style={{ color: "#9ca3af" }}>›</span>
        </div>
      </div>
    </div>
  );
}
