import { useState, useRef, useEffect } from "react";
import { FiSend, FiChevronDown, FiCheck, FiTrash2, FiSave } from "react-icons/fi";
import api from "../../services/api";
import "../settings/Settings.css";

const TEMPLATES_KEY = "td_announcement_templates";

const DEFAULT_TEMPLATES = [
  {
    id: "t-maintenance",
    name: "Scheduled Maintenance",
    subject: "Scheduled maintenance this weekend",
    body: "Hi team,\n\nWe'll be performing scheduled maintenance on TickDesk this weekend. You may see brief downtime during that window.\n\nThanks,\nTickDesk Team",
  },
  {
    id: "t-feature",
    name: "New Feature Announcement",
    subject: "New feature now live on TickDesk",
    body: "Hi team,\n\nWe've just shipped a new feature on TickDesk. Log in to check it out.\n\nThanks,\nTickDesk Team",
  },
];

function loadTemplates() {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_TEMPLATES;
  } catch {
    return DEFAULT_TEMPLATES;
  }
}

export default function Announcements() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sentNotice, setSentNotice] = useState(null);

  const [companies, setCompanies] = useState([]);
  const [recipient, setRecipient] = useState(null); // null = All Companies
  const [recipientQuery, setRecipientQuery] = useState("");
  const [recipientOpen, setRecipientOpen] = useState(false);
  const recipientRef = useRef(null);

  const [templates, setTemplates] = useState(loadTemplates);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [saveBoxOpen, setSaveBoxOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const templateRef = useRef(null);

  useEffect(() => {
    api.get("platform/announcements/").then((r) => setCompanies(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (recipientRef.current && !recipientRef.current.contains(e.target)) setRecipientOpen(false);
      if (templateRef.current && !templateRef.current.contains(e.target)) setTemplateOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(recipientQuery.trim().toLowerCase())
  );

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || null;

  const persistTemplates = (next) => {
    setTemplates(next);
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(next));
  };

  const applyTemplate = (t) => {
    setSubject(t.subject);
    setMessage(t.body);
    setSelectedTemplateId(t.id);
    setTemplateOpen(false);
  };

  const clearTemplate = () => {
    setSelectedTemplateId(null);
    setTemplateOpen(false);
  };

  const deleteTemplate = (id, e) => {
    e.stopPropagation();
    persistTemplates(templates.filter((t) => t.id !== id));
    if (selectedTemplateId === id) setSelectedTemplateId(null);
  };

  const updateSelectedTemplate = () => {
    if (!selectedTemplate) return;
    persistTemplates(templates.map((t) =>
      t.id === selectedTemplate.id ? { ...t, subject, body: message } : t
    ));
  };

  const openSaveBox = () => {
    setNewTemplateName("");
    setSaveBoxOpen(true);
  };

  const confirmSaveAsNew = () => {
    if (!newTemplateName.trim()) return;
    const t = { id: `t-${Date.now()}`, name: newTemplateName.trim(), subject, body: message };
    persistTemplates([...templates, t]);
    setSelectedTemplateId(t.id);
    setSaveBoxOpen(false);
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    try {
      const r = await api.post("platform/announcements/", {
        subject,
        message,
        company_id: recipient?.id,
      });
      setSentNotice(r.data.detail);
      setSubject("");
      setMessage("");
      setSelectedTemplateId(null);
    } catch {
      setSentNotice("Couldn't send the announcement. Please try again.");
    } finally {
      setSending(false);
      setTimeout(() => setSentNotice(null), 3500);
    }
  };

  return (
    <div className="st-page" style={{ gridTemplateColumns: "1fr" }}>
      <div className="st-main" style={{ maxWidth: 640 }}>
        <div>
          <h1 className="st-page-title">Announcements</h1>
          <p className="st-page-sub">Broadcast a message to every company admin, or a single company.</p>
        </div>

        <div className="st-card">
          <div className="st-card-header">
            <h2 className="st-card-title"><FiSend size={15} color="#2563eb" /> Send Announcement</h2>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>
              {recipient ? `Emails just ${recipient.name}'s admin` : "Emails every company admin on the platform"}
            </span>
          </div>
          <div className="st-card-body">
            {sentNotice && (
              <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", color: "#16a34a", fontSize: 13, fontWeight: 600, padding: "10px 16px", borderRadius: 10, marginBottom: 14 }}>
                {sentNotice}
              </div>
            )}

            {/* Template picker */}
            <div className="st-field" style={{ marginBottom: 14, position: "relative" }} ref={templateRef}>
              <label>Template</label>
              <div
                className="st-input"
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
                onClick={() => setTemplateOpen((o) => !o)}
              >
                <span style={{ color: selectedTemplate ? "#111827" : "#374151" }}>
                  {selectedTemplate ? selectedTemplate.name : "Blank (no template)"}
                </span>
                <FiChevronDown size={14} color="#9ca3af" />
              </div>

              {templateOpen && (
                <div style={{
                  position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4,
                  background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10,
                  boxShadow: "0 8px 24px rgba(15,23,42,0.08)", zIndex: 20, overflow: "hidden",
                  maxHeight: 260, overflowY: "auto",
                }}>
                  <div
                    onClick={clearTemplate}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", fontSize: 13, cursor: "pointer", color: "#374151" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    Blank (no template)
                    {!selectedTemplate && <FiCheck size={14} color="#2563eb" />}
                  </div>
                  {templates.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => applyTemplate(t)}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", fontSize: 13, cursor: "pointer", color: "#374151" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <span>{t.name}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {selectedTemplateId === t.id && <FiCheck size={14} color="#2563eb" />}
                        <FiTrash2
                          size={13}
                          color="#dc2626"
                          onClick={(e) => deleteTemplate(t.id, e)}
                          title="Delete template"
                        />
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="st-field" style={{ marginBottom: 14, position: "relative" }} ref={recipientRef}>
              <label>Send To</label>
              <div
                className="st-input"
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
                onClick={() => setRecipientOpen((o) => !o)}
              >
                <span style={{ color: recipient ? "#111827" : "#374151" }}>
                  {recipient ? `${recipient.name} (${recipient.admin})` : "All Companies"}
                </span>
                <FiChevronDown size={14} color="#9ca3af" />
              </div>

              {recipientOpen && (
                <div style={{
                  position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4,
                  background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10,
                  boxShadow: "0 8px 24px rgba(15,23,42,0.08)", zIndex: 20, overflow: "hidden",
                }}>
                  <input
                    className="st-input"
                    autoFocus
                    placeholder="Search companies…"
                    value={recipientQuery}
                    onChange={(e) => setRecipientQuery(e.target.value)}
                    style={{ border: "none", borderBottom: "1.5px solid #f3f4f6", borderRadius: 0 }}
                  />
                  <div style={{ maxHeight: 220, overflowY: "auto" }}>
                    <div
                      onClick={() => { setRecipient(null); setRecipientOpen(false); setRecipientQuery(""); }}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", fontSize: 13, cursor: "pointer", color: "#374151" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      All Companies
                      {!recipient && <FiCheck size={14} color="#2563eb" />}
                    </div>
                    {filteredCompanies.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => { setRecipient(c); setRecipientOpen(false); setRecipientQuery(""); }}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", fontSize: 13, cursor: "pointer", color: "#374151" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <span>{c.name} <span style={{ color: "#9ca3af" }}>— {c.admin}</span></span>
                        {recipient?.id === c.id && <FiCheck size={14} color="#2563eb" />}
                      </div>
                    ))}
                    {filteredCompanies.length === 0 && (
                      <div style={{ padding: "9px 12px", fontSize: 13, color: "#9ca3af" }}>No companies match "{recipientQuery}"</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="st-field" style={{ marginBottom: 14 }}>
              <label>Subject</label>
              <input className="st-input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Scheduled maintenance this weekend" />
            </div>
            <div className="st-field" style={{ marginBottom: 10 }}>
              <label>Message</label>
              <textarea
                className="st-input"
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write the announcement that will go out to every company admin…"
                style={{ resize: "vertical", fontFamily: "inherit" }}
              />
            </div>

            {/* Template save/update row */}
            {!saveBoxOpen ? (
              <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
                <button
                  onClick={openSaveBox}
                  disabled={!subject.trim() || !message.trim()}
                  style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", padding: 0, fontSize: 12, fontWeight: 600, color: "#2563eb", cursor: "pointer" }}
                >
                  <FiSave size={13} /> Save as Template
                </button>
                {selectedTemplate && (
                  <button
                    onClick={updateSelectedTemplate}
                    style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", padding: 0, fontSize: 12, fontWeight: 600, color: "#2563eb", cursor: "pointer" }}
                  >
                    <FiSave size={13} /> Update "{selectedTemplate.name}"
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <input
                  className="st-input"
                  autoFocus
                  placeholder="Template name…"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && confirmSaveAsNew()}
                />
                <button className="st-btn-primary" style={{ flexShrink: 0 }} onClick={confirmSaveAsNew} disabled={!newTemplateName.trim()}>Save</button>
                <button className="st-btn-secondary" style={{ flexShrink: 0 }} onClick={() => setSaveBoxOpen(false)}>Cancel</button>
              </div>
            )}

            <div className="st-form-footer">
              <button
                className="st-btn-primary"
                onClick={handleSend}
                disabled={sending || !subject.trim() || !message.trim()}
              >
                {sending ? "Sending…" : recipient ? `Send to ${recipient.name}` : "Send to All Admins"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
