import { useState } from "react";
import {
  FiUploadCloud, FiDownload, FiRefreshCw, FiAlertOctagon,
} from "react-icons/fi";
import "../settings/Settings.css";

const systemStatus = [
  { label: "Frontend",    status: "ONLINE", dot: "green" },
  { label: "Backend API", status: "ONLINE", dot: "green" },
  { label: "Database",    status: "ONLINE", dot: "green" },
  { label: "SMTP Server", status: "ONLINE", dot: "green" },
];

const recentChanges = [
  { text: "Updated Brand Colors",  meta: "10 minutes ago • Admin",  dot: "blue" },
  { text: "Modified Support Email", meta: "2 hours ago • Sarah K.",  dot: "gray" },
  { text: "New User Added",         meta: "Yesterday • System",      dot: "gray" },
];

export default function Organization() {
  const [form, setForm] = useState({
    orgName: "Acme Corp IT",
    email: "support@acme.com",
    website: "https://acme-corp.com",
    timezone: "GMT+0",
    language: "English",
    dateFormat: "MM/DD/YYYY",
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="st-page">
      {/* ── Main ── */}
      <div className="st-main">
        {/* Header */}
        <div className="st-page-header">
          <div>
            <h1 className="st-page-title">Settings</h1>
            <p className="st-page-sub">Manage your organization's application settings and system configuration.</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="st-btn-secondary">Reset</button>
            <button className="st-btn-primary">Save Changes</button>
          </div>
        </div>

        {/* Organization Information */}
        <div className="st-card">
          <div className="st-card-header">
            <h2 className="st-card-title">Organization Information</h2>
          </div>
          <div className="st-card-body">
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 20 }}>
              <div className="st-logo-upload">
                <FiUploadCloud size={22} color="#2563eb" />
                <span>Upload Logo</span>
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: 13, color: "#111827", margin: "0 0 4px" }}>Company Logo</p>
                <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>PNG, JPG or GIF. Max size 2MB.<br />Recommended 400×400px.</p>
              </div>
            </div>
            <hr className="st-divider" />
            <div className="st-form-grid" style={{ marginBottom: 14 }}>
              <div className="st-field">
                <label>Organization Name</label>
                <input className="st-input" value={form.orgName} onChange={set("orgName")} />
              </div>
              <div className="st-field">
                <label>Support Email</label>
                <input className="st-input" value={form.email} onChange={set("email")} />
              </div>
            </div>
            <div className="st-field" style={{ marginBottom: 14 }}>
              <label>Website</label>
              <input className="st-input" value={form.website} onChange={set("website")} />
            </div>
            <div className="st-form-grid-3">
              <div className="st-field">
                <label>Timezone</label>
                <div className="st-select-wrap">
                  <select className="st-select" value={form.timezone} onChange={set("timezone")}>
                    <option>GMT+0</option><option>GMT+5:30</option><option>GMT-5</option>
                  </select>
                </div>
              </div>
              <div className="st-field">
                <label>Language</label>
                <div className="st-select-wrap">
                  <select className="st-select" value={form.language} onChange={set("language")}>
                    <option>English</option><option>French</option><option>Spanish</option>
                  </select>
                </div>
              </div>
              <div className="st-field">
                <label>Date Format</label>
                <div className="st-select-wrap">
                  <select className="st-select" value={form.dateFormat} onChange={set("dateFormat")}>
                    <option>MM/DD/YYYY</option><option>DD/MM/YYYY</option><option>YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="st-form-footer">
              <button className="st-btn-secondary">Cancel</button>
              <button className="st-btn-primary">Save Changes</button>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="st-card">
          <div className="st-card-header">
            <h2 className="st-card-title">Branding</h2>
          </div>
          <div className="st-card-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <div className="st-color-row">
                <div className="st-color-swatch" style={{ background: "linear-gradient(135deg,#1e40af,#2563eb)" }} />
                <div className="st-color-info">
                  <p className="st-color-name">Primary Color</p>
                  <p className="st-color-desc">Main UI action buttons and accents</p>
                </div>
              </div>
              <div className="st-color-row">
                <div className="st-color-swatch" style={{ background: "linear-gradient(135deg,#0d9488,#0891b2)" }} />
                <div className="st-color-info">
                  <p className="st-color-name">Accent Color</p>
                  <p className="st-color-desc">Secondary UI highlights and indicators</p>
                </div>
              </div>
            </div>
            <div style={{ border: "1.5px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ background: "#2563eb", padding: "6px 12px", display: "flex", justifyContent: "flex-end" }}>
                <span style={{ background: "#fff", color: "#2563eb", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>PREVIEW</span>
              </div>
              <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <div style={{ width: 40, height: 28, background: "#2563eb", borderRadius: 6 }} />
                  <div style={{ flex: 1, background: "#e5e7eb", borderRadius: 6 }} />
                </div>
                {[1,2,3].map(i => (
                  <div key={i} style={{ height: 8, background: "#f3f4f6", borderRadius: 4, width: `${70 + i * 10}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="st-right">
        <div className="st-panel-card">
          <p className="st-panel-title">Quick Actions</p>
          <button className="st-qa-item"><FiUploadCloud size={15} color="#2563eb" /> Import Data</button>
          <button className="st-qa-item"><FiDownload size={15} color="#2563eb" /> Export Settings</button>
          <button className="st-qa-item danger"><FiAlertOctagon size={15} /> Factory Reset</button>
        </div>
        <div className="st-panel-card">
          <p className="st-panel-title">System Status</p>
          {systemStatus.map((s) => (
            <div key={s.label} className="st-status-row">
              <span className="st-status-label">{s.label}</span>
              <span className="st-status-online">
                <span className={`st-dot st-dot-${s.dot}`} />
                <span style={{ color: "#16a34a", fontSize: 11, fontWeight: 700 }}>{s.status}</span>
              </span>
            </div>
          ))}
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
          <button style={{ fontSize: 12, color: "#2563eb", fontWeight: 600, background: "none", border: "none", cursor: "pointer", marginTop: 8, padding: 0 }}>
            View Audit Log
          </button>
        </div>
      </div>
    </div>
  );
}
