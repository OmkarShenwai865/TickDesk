import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./EmployeePortal.css";
import {
    FiLogOut, FiPlus, FiX, FiSend,
    FiMessageSquare, FiPaperclip, FiCheckCircle,
} from "react-icons/fi";

const STATUS_LABEL = { open: "Open", in_progress: "In Progress", resolved: "Resolved", closed: "Closed" };
const STATUS_CLASS = { open: "ep-badge-open", in_progress: "ep-badge-progress", resolved: "ep-badge-resolved", closed: "ep-badge-closed" };
const PRIORITY_COLOR = { low: "#16a34a", medium: "#d97706", high: "#ea580c", critical: "#dc2626" };

function fmtDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function initials(name) {
    if (!name) return "?";
    return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

const PRIORITY_LABEL = { low: "Low", medium: "Medium", high: "High", critical: "Critical" };
const PRIORITY_BG    = { low: "#16a34a", medium: "#d97706", high: "#ea580c", critical: "#dc2626" };

// ── New Ticket Modal ──────────────────────────────────────────────────────────
function NewTicketModal({ onClose, onCreated }) {
    const [form,        setForm]       = useState({ title: "", description: "", priority: "medium" });
    const [error,       setError]      = useState("");
    const [submitting,  setSubmitting] = useState(false);
    const [aiSuggested, setAiSuggested] = useState(null); // detected priority label to show
    const suggestTimer = useRef(null);

    const handleChange = (field) => (e) => {
        const value = e.target.value;
        setForm(p => ({ ...p, [field]: value }));
        setError("");

        if (field === "title" || field === "description") {
            clearTimeout(suggestTimer.current);
            const newForm = { ...form, [field]: value };
            const text = (newForm.title + newForm.description).trim();
            if (text.length < 5) { setAiSuggested(null); return; }
            suggestTimer.current = setTimeout(async () => {
                try {
                    const res = await api.post("tickets/suggest-priority/", {
                        title: newForm.title,
                        description: newForm.description,
                    });
                    const p = res.data.priority;
                    setForm(prev => ({ ...prev, priority: p }));
                    setAiSuggested(p);
                } catch { /* silent */ }
            }, 600);
        }
    };

    const handleSubmit = async () => {
        if (!form.title.trim()) { setError("Title is required."); return; }
        setSubmitting(true);
        try {
            const r = await api.post("tickets/", {
                title:       form.title.trim(),
                description: form.description.trim(),
                priority:    form.priority,
            });
            onCreated(r.data);
            onClose();
        } catch (err) {
            const d = err.response?.data;
            setError(d?.detail || (typeof d === "object" ? Object.values(d).flat().join(" ") : null) || "Failed to create ticket.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="ep-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="ep-modal">
                <div className="ep-modal-header">
                    <h2>Raise a Ticket</h2>
                    <button className="ep-modal-close" onClick={onClose}><FiX size={18} /></button>
                </div>
                <div className="ep-modal-body">
                    {error && <div className="ep-err-banner">{error}</div>}
                    <div className="ep-field">
                        <label>Subject <span style={{ color: "#ef4444" }}>*</span></label>
                        <input className="ep-input" placeholder="Briefly describe your issue" value={form.title} onChange={handleChange("title")} />
                    </div>
                    <div className="ep-field">
                        <label>Description</label>
                        <textarea className="ep-input ep-textarea" rows={4} placeholder="Provide more details…" value={form.description} onChange={handleChange("description")} />
                    </div>
                    {aiSuggested && (
                        <div className="ep-ai-priority">
                            <span className="ep-ai-dot" style={{ background: PRIORITY_BG[aiSuggested] }} />
                            Priority auto-detected: <strong style={{ color: PRIORITY_BG[aiSuggested] }}>{PRIORITY_LABEL[aiSuggested]}</strong>
                        </div>
                    )}
                </div>
                <div className="ep-modal-footer">
                    <button className="ep-btn-cancel" onClick={onClose} disabled={submitting}>Cancel</button>
                    <button className="ep-btn-submit" onClick={handleSubmit} disabled={submitting}>
                        {submitting ? "Submitting…" : "Submit Ticket"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Portal ───────────────────────────────────────────────────────────────
export default function EmployeePortal() {
    const navigate = useNavigate();
    const [profile,    setProfile]    = useState(null);
    const [tickets,    setTickets]    = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [showModal,  setShowModal]  = useState(false);
    const [selected,   setSelected]   = useState(null);
    const [comments,   setComments]   = useState([]);
    const [comment,    setComment]    = useState("");
    const [sending,    setSending]    = useState(false);

    useEffect(() => {
        Promise.all([
            api.get("accounts/profile/"),
            api.get("tickets/?page_size=100"),
        ]).then(([p, t]) => {
            setProfile(p.data);
            setTickets(t.data.results ?? []);
        }).catch(() => {})
          .finally(() => setLoading(false));
    }, []);

    const openTicket = async (tk) => {
        setSelected(tk);
        setComment("");
        try {
            const r = await api.get(`tickets/${tk.id}/comments/`);
            setComments(r.data);
        } catch { setComments([]); }
    };

    const handleSendComment = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;
        setSending(true);
        try {
            const r = await api.post(`tickets/${selected.id}/comments/`, { text: comment.trim() });
            setComments(prev => [...prev, r.data]);
            setComment("");
        } catch {}
        finally { setSending(false); }
    };

    const handleCreated = (newTicket) => {
        setTickets(prev => [newTicket, ...prev]);
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    const open     = tickets.filter(t => t.status === "open").length;
    const resolved = tickets.filter(t => t.status === "resolved" || t.status === "closed").length;

    if (loading) return <div className="ep-loading">Loading…</div>;

    return (
        <div className="ep-root">
            {showModal && <NewTicketModal onClose={() => setShowModal(false)} onCreated={handleCreated} />}

            {/* ── Header ── */}
            <header className="ep-header">
                <div className="ep-header-brand">
                    <span className="ep-brand-dot">T</span>
                    <span className="ep-brand-name">TickDesk</span>
                    <span className="ep-brand-tag">Employee Portal</span>
                </div>
                <div className="ep-header-right">
                    <div className="ep-user-chip">
                        <div className="ep-user-avatar">
                            {initials(`${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`)}
                        </div>
                        <div>
                            <p className="ep-user-name">{profile?.first_name} {profile?.last_name}</p>
                            <p className="ep-user-email">{profile?.email}</p>
                        </div>
                    </div>
                    <button className="ep-logout" onClick={handleLogout}>
                        <FiLogOut size={14} /> Logout
                    </button>
                </div>
            </header>

            <div className="ep-body">

                {/* ── Left: ticket list ── */}
                <div className="ep-left">
                    {/* Stats row */}
                    <div className="ep-stats">
                        <div className="ep-stat">
                            <p className="ep-stat-val">{tickets.length}</p>
                            <p className="ep-stat-label">Total Tickets</p>
                        </div>
                        <div className="ep-stat">
                            <p className="ep-stat-val ep-stat-blue">{open}</p>
                            <p className="ep-stat-label">Open</p>
                        </div>
                        <div className="ep-stat">
                            <p className="ep-stat-val ep-stat-green">{resolved}</p>
                            <p className="ep-stat-label">Resolved</p>
                        </div>
                        <button className="ep-raise-btn" onClick={() => setShowModal(true)}>
                            <FiPlus size={15} /> Raise a Ticket
                        </button>
                    </div>

                    <div className="ep-list-label">My Tickets</div>

                    <div className="ep-ticket-list">
                        {tickets.length === 0 ? (
                            <div className="ep-empty">
                                <FiPaperclip size={32} color="#cbd5e1" />
                                <p>No tickets yet. Raise one above!</p>
                            </div>
                        ) : tickets.map(tk => (
                            <div
                                key={tk.id}
                                className={`ep-ticket-row${selected?.id === tk.id ? " ep-ticket-active" : ""}`}
                                onClick={() => openTicket(tk)}
                            >
                                <div className="ep-ticket-top">
                                    <span className="ep-ticket-num">{tk.ticket_number}</span>
                                    <span className={`ep-badge ${STATUS_CLASS[tk.status] ?? ""}`}>
                                        {STATUS_LABEL[tk.status] ?? tk.status}
                                    </span>
                                </div>
                                <p className="ep-ticket-title">{tk.title}</p>
                                <div className="ep-ticket-foot">
                                    <span style={{ color: PRIORITY_COLOR[tk.priority], fontSize: 11, fontWeight: 600 }}>
                                        {tk.priority?.toUpperCase()}
                                    </span>
                                    <span className="ep-ticket-date">{fmtDate(tk.created_at)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Right: detail + conversation ── */}
                <div className="ep-right">
                    {!selected ? (
                        <div className="ep-no-select">
                            <FiCheckCircle size={40} color="#e2e8f0" />
                            <p>Select a ticket to view details</p>
                        </div>
                    ) : (
                        <>
                            <div className="ep-detail-header">
                                <div>
                                    <p className="ep-detail-num">{selected.ticket_number}</p>
                                    <p className="ep-detail-title">{selected.title}</p>
                                </div>
                                <span className={`ep-badge ${STATUS_CLASS[selected.status]}`}>
                                    {STATUS_LABEL[selected.status]}
                                </span>
                            </div>

                            <div className="ep-detail-meta">
                                <div className="ep-meta-row">
                                    <span className="ep-meta-key">Priority</span>
                                    <span style={{ color: PRIORITY_COLOR[selected.priority], fontWeight: 600, fontSize: 13 }}>
                                        {selected.priority?.toUpperCase()}
                                    </span>
                                </div>
                                <div className="ep-meta-row">
                                    <span className="ep-meta-key">Assigned To</span>
                                    <span className="ep-meta-val">{selected.assigned_to_name ?? "Pending assignment"}</span>
                                </div>
                                <div className="ep-meta-row">
                                    <span className="ep-meta-key">Department</span>
                                    <span className="ep-meta-val">{selected.department_name ?? "—"}</span>
                                </div>
                                <div className="ep-meta-row">
                                    <span className="ep-meta-key">Opened</span>
                                    <span className="ep-meta-val">{fmtDate(selected.created_at)}</span>
                                </div>
                            </div>

                            {selected.description && (
                                <div className="ep-desc-box">
                                    <p className="ep-desc-label">Description</p>
                                    <p className="ep-desc-text">{selected.description}</p>
                                </div>
                            )}

                            {/* Conversation */}
                            <div className="ep-convo">
                                <p className="ep-convo-label"><FiMessageSquare size={13} /> Conversation with support</p>
                                <div className="ep-convo-messages">
                                    {comments.length === 0
                                        ? <p className="ep-no-msg">No messages yet. You can add one below.</p>
                                        : comments.map(c => (
                                            <div key={c.id} className="ep-msg">
                                                <div className="ep-msg-avatar">{initials(c.author_name)}</div>
                                                <div>
                                                    <p className="ep-msg-author">{c.author_name}</p>
                                                    <p className="ep-msg-text">{c.text}</p>
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                                <form className="ep-msg-form" onSubmit={handleSendComment}>
                                    <input
                                        className="ep-msg-input"
                                        placeholder="Type a message to support…"
                                        value={comment}
                                        onChange={e => setComment(e.target.value)}
                                        disabled={sending}
                                    />
                                    <button type="submit" className="ep-msg-send" disabled={sending || !comment.trim()}>
                                        <FiSend size={14} />
                                    </button>
                                </form>
                            </div>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
}
