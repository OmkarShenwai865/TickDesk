import { useState, useEffect } from "react";
import { FiUploadCloud, FiDownload, FiAlertOctagon } from "react-icons/fi";
import api from "../../services/api";
import "../settings/Settings.css";

const systemStatus = [
  { label: "Frontend",    dot: "green" },
  { label: "Backend API", dot: "green" },
  { label: "Database",    dot: "green" },
  { label: "SMTP Server", dot: "green" },
];

const recentChanges = [
  { text: "Updated Brand Colors",   meta: "10 minutes ago • Admin",  dot: "blue" },
  { text: "Modified Support Email", meta: "2 hours ago • Sarah K.",  dot: "gray" },
  { text: "New User Added",         meta: "Yesterday • System",      dot: "gray" },
];

const EMPTY_FORM = {
  orgName:    "",
  email:      "",
  website:    "",
  timezone:   "GMT+0",
  dateFormat: "MM/DD/YYYY",
};

export default function General() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // { type: "success" | "error", text }

  const load = () => {
    setLoading(true);
    api.get("accounts/company/")
      .then((r) => {
        setForm({
          orgName:    r.data.name || "",
          email:      r.data.support_email || "",
          website:    r.data.website || "",
          timezone:   r.data.timezone || "GMT+0",
          dateFormat: r.data.date_format || "MM/DD/YYYY",
        });
      })
      .catch(() => setStatus({ type: "error", text: "Failed to load organisation settings." }))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = () => {
    setSaving(true);
    setStatus(null);
    api.patch("accounts/company/", {
      name:          form.orgName,
      support_email: form.email,
      website:       form.website,
      timezone:      form.timezone,
      date_format:   form.dateFormat,
    })
      .then(() => setStatus({ type: "success", text: "Settings saved." }))
      .catch(() => setStatus({ type: "error", text: "Failed to save changes." }))
      .finally(() => setSaving(false));
  };

  return (
    <div className="st-page">
      <div className="st-main">
        {/* Header */}
        <div className="st-page-header">
          <div>
            <h1 className="st-page-title">General Settings</h1>
            <p className="st-page-sub">Manage your organisation's identity, branding, and locale preferences.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {status && (
              <span style={{ fontSize: 12, fontWeight: 600, color: status.type === "success" ? "#16a34a" : "#dc2626" }}>
                {status.text}
              </span>
            )}
            <button className="st-btn-secondary" onClick={load} disabled={loading || saving}>Reset</button>
            <button className="st-btn-primary" onClick={handleSave} disabled={loading || saving}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Organisation Information */}
        <div className="st-card">
          <div className="st-card-header">
            <h2 className="st-card-title">Organisation Information</h2>
          </div>
          <div className="st-card-body">
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
                <label>Organisation Name</label>
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
            <div className="st-form-grid">
              <div className="st-field">
                <label>Timezone</label>
                <div className="st-select-wrap">
                  <select className="st-select" value={form.timezone} onChange={set("timezone")}>
                    <option>GMT+0</option><option>GMT+5:30</option><option>GMT-5</option>
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
              <button className="st-btn-secondary" onClick={load} disabled={loading || saving}>Cancel</button>
              <button className="st-btn-primary" onClick={handleSave} disabled={loading || saving}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="st-card">
          <div className="st-card-header">
            <h2 className="st-card-title">Branding</h2>
            <button className="st-btn-secondary st-btn-sm">Edit Colors</button>
          </div>
          <div className="st-card-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <div className="st-color-row">
                <div className="st-color-swatch" style={{ background: "linear-gradient(135deg,#1e40af,#2563eb)" }} />
                <div className="st-color-info">
                  <p className="st-color-name">Primary Color</p>
                  <p className="st-color-desc">Main UI buttons and accent elements</p>
                  <p style={{ fontSize: 11, color: "#9ca3af", margin: "4px 0 0", fontFamily: "monospace" }}>#2563EB</p>
                </div>
              </div>
              <div className="st-color-row">
                <div className="st-color-swatch" style={{ background: "linear-gradient(135deg,#0d9488,#0891b2)" }} />
                <div className="st-color-info">
                  <p className="st-color-name">Accent Color</p>
                  <p className="st-color-desc">Secondary highlights and indicators</p>
                  <p style={{ fontSize: 11, color: "#9ca3af", margin: "4px 0 0", fontFamily: "monospace" }}>#0891B2</p>
                </div>
              </div>
            </div>
            {/* Preview panel */}
            <div style={{ border: "1.5px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ background: "#2563eb", padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", opacity: 0.9 }}>TickDesk</span>
                <span style={{ background: "#fff", color: "#2563eb", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>PREVIEW</span>
              </div>
              <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <div style={{ width: 40, height: 28, background: "#2563eb", borderRadius: 6 }} />
                  <div style={{ flex: 1, background: "#e5e7eb", borderRadius: 6 }} />
                </div>
                {[90, 100, 75].map((w, i) => (
                  <div key={i} style={{ height: 8, background: "#f3f4f6", borderRadius: 4, width: `${w}%` }} />
                ))}
                <div style={{ display: "flex", gap: 6 }}>
                  <div style={{ padding: "4px 10px", background: "#2563eb", borderRadius: 5, fontSize: 10, color: "#fff", fontWeight: 600 }}>Save</div>
                  <div style={{ padding: "4px 10px", border: "1px solid #e5e7eb", borderRadius: 5, fontSize: 10, color: "#6b7280" }}>Cancel</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="st-right">
        <div className="st-panel-card">
          <p className="st-panel-title">Quick Actions</p>
          <button className="st-qa-item"><FiUploadCloud size={15} color="#2563eb" />
            <div>
              <div style={{ fontWeight: 600 }}>Import Data</div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>CSV or JSON</div>
            </div>
          </button>
          <button className="st-qa-item"><FiDownload size={15} color="#2563eb" />
            <div>
              <div style={{ fontWeight: 600 }}>Export Settings</div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>Download config file</div>
            </div>
          </button>
          <button className="st-qa-item danger"><FiAlertOctagon size={15} />
            <div>
              <div style={{ fontWeight: 600 }}>Factory Reset</div>
              <div style={{ fontSize: 11, color: "#f87171" }}>Irreversible action</div>
            </div>
          </button>
        </div>

        <div className="st-panel-card">
          <p className="st-panel-title">System Status</p>
          {systemStatus.map((s) => (
            <div key={s.label} className="st-status-row">
              <span className="st-status-label">{s.label}</span>
              <span className="st-status-online">
                <span className={`st-dot st-dot-${s.dot}`} />
                <span style={{ color: "#16a34a", fontSize: 11, fontWeight: 700 }}>ONLINE</span>
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
