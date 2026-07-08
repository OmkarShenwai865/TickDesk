import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./AgentPortal.css";
import {
    FiLogOut, FiRefreshCcw, FiCheckCircle, FiClock,
    FiAlertCircle, FiMessageSquare, FiUser, FiPackage,
    FiBook, FiClipboard, FiX, FiSearch, FiEdit2, FiSave,
} from "react-icons/fi";

const PRIORITY_COLOR = { low: "#16a34a", medium: "#d97706", high: "#ea580c", critical: "#dc2626" };
const STATUS_LABEL   = { open: "Open", in_progress: "In Progress", resolved: "Resolved", closed: "Closed" };
const STATUS_CLASS   = { open: "ap-badge-open", in_progress: "ap-badge-progress", resolved: "ap-badge-resolved", closed: "ap-badge-closed" };
const ASSET_STATUS_COLOR = { available: "#16a34a", assigned: "#2563eb", maintenance: "#d97706", retired: "#6b7280" };
const ASSET_STATUS_BG    = { available: "#dcfce7", assigned: "#dbeafe", maintenance: "#fef3c7", retired: "#f1f5f9" };

function fmtDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function initials(name) {
    if (!name) return "?";
    return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

// ── Nav items ──────────────────────────────────────────────────────────────
const NAV = [
    { key: "tickets",       label: "Tickets",        Icon: FiClipboard },
    { key: "assets",        label: "Assets",         Icon: FiPackage },
    { key: "knowledge",     label: "Knowledge Base", Icon: FiBook    },
    { key: "profile",       label: "Profile",        Icon: FiUser    },
];

// ── Tickets view ───────────────────────────────────────────────────────────
function TicketsView({ profile }) {
    const [tickets,  setTickets]  = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [selected, setSelected] = useState(null);
    const [comment,  setComment]  = useState("");
    const [sending,  setSending]  = useState(false);
    const [comments, setComments] = useState([]);
    const [filter,   setFilter]   = useState("all");

    useEffect(() => {
        api.get("tickets/?page_size=100")
            .then(r => setTickets(r.data.results ?? []))
            .catch(() => {})
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

    const handleResolve = async () => {
        if (!selected) return;
        try {
            await api.patch(`tickets/${selected.id}/`, { status: "resolved" });
            setTickets(prev => prev.map(t => t.id === selected.id ? { ...t, status: "resolved" } : t));
            setSelected(s => ({ ...s, status: "resolved" }));
        } catch {}
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

    const filtered = filter === "all" ? tickets : tickets.filter(t => t.status === filter);

    if (loading) return <div className="ap-view-loading">Loading tickets…</div>;

    return (
        <div className="ap-tickets-root">
            <div className="ap-main">
                <div className="ap-header">
                    <div>
                        <h1 className="ap-title">My Ticket Queue</h1>
                        <p className="ap-subtitle">{tickets.length} tickets assigned to you</p>
                    </div>
                    <div className="ap-filter-tabs">
                        {["all", "open", "in_progress", "resolved"].map(f => (
                            <button key={f} className={`ap-tab${filter === f ? " ap-tab-active" : ""}`}
                                onClick={() => setFilter(f)}>
                                {f === "all" ? "All" : STATUS_LABEL[f]}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="ap-ticket-list">
                    {filtered.length === 0 ? (
                        <div className="ap-empty">
                            <FiCheckCircle size={36} color="#d1fae5" />
                            <p>No tickets here.</p>
                        </div>
                    ) : filtered.map(tk => (
                        <div key={tk.id}
                            className={`ap-ticket-row${selected?.id === tk.id ? " ap-ticket-row-active" : ""}`}
                            onClick={() => openTicket(tk)}>
                            <div className="ap-ticket-left">
                                <span className="ap-ticket-id">{tk.ticket_number}</span>
                                <div>
                                    <p className="ap-ticket-title">{tk.title}</p>
                                    <p className="ap-ticket-meta">{tk.department_name ?? "—"} · {fmtDate(tk.created_at)}</p>
                                </div>
                            </div>
                            <div className="ap-ticket-right">
                                <span className="ap-priority-dot" style={{ background: PRIORITY_COLOR[tk.priority] ?? "#6b7280" }} />
                                <span className={`ap-badge ${STATUS_CLASS[tk.status] ?? ""}`}>
                                    {STATUS_LABEL[tk.status] ?? tk.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {selected && (
                <div className="ap-detail">
                    <div className="ap-detail-header">
                        <div>
                            <p className="ap-detail-id">{selected.ticket_number}</p>
                            <p className="ap-detail-title">{selected.title}</p>
                        </div>
                        <button className="ap-detail-close" onClick={() => setSelected(null)}><FiX size={16} /></button>
                    </div>
                    <div className="ap-detail-body">
                        <div className="ap-detail-row">
                            <span className="ap-detail-key">Status</span>
                            <span className={`ap-badge ${STATUS_CLASS[selected.status]}`}>{STATUS_LABEL[selected.status]}</span>
                        </div>
                        <div className="ap-detail-row">
                            <span className="ap-detail-key">Priority</span>
                            <span style={{ color: PRIORITY_COLOR[selected.priority], fontWeight: 600, fontSize: 13 }}>
                                {selected.priority?.toUpperCase()}
                            </span>
                        </div>
                        <div className="ap-detail-row">
                            <span className="ap-detail-key">Requester</span>
                            <span className="ap-detail-val">{selected.created_by_name ?? "—"}</span>
                        </div>
                        <div className="ap-detail-row">
                            <span className="ap-detail-key">Department</span>
                            <span className="ap-detail-val">{selected.department_name ?? "—"}</span>
                        </div>
                        <div className="ap-detail-row">
                            <span className="ap-detail-key">Created</span>
                            <span className="ap-detail-val">{fmtDate(selected.created_at)}</span>
                        </div>
                        {selected.description && (
                            <div className="ap-detail-desc">
                                <p className="ap-detail-key">Description</p>
                                <p className="ap-detail-desc-text">{selected.description}</p>
                            </div>
                        )}
                        {selected.status !== "resolved" && selected.status !== "closed" && (
                            <button className="ap-resolve-btn" onClick={handleResolve}>
                                <FiCheckCircle size={14} /> Mark as Resolved
                            </button>
                        )}
                        <div className="ap-comments-section">
                            <p className="ap-comments-label"><FiMessageSquare size={13} /> Conversation</p>
                            <div className="ap-comments-list">
                                {comments.length === 0
                                    ? <p className="ap-no-comments">No messages yet.</p>
                                    : comments.map(c => (
                                        <div key={c.id} className="ap-comment">
                                            <div className="ap-comment-avatar"><FiUser size={12} /></div>
                                            <div>
                                                <p className="ap-comment-author">{c.author_name}</p>
                                                <p className="ap-comment-text">{c.text}</p>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                            <form className="ap-comment-form" onSubmit={handleSendComment}>
                                <input className="ap-comment-input" placeholder="Add a comment…"
                                    value={comment} onChange={e => setComment(e.target.value)} disabled={sending} />
                                <button type="submit" className="ap-comment-send" disabled={sending || !comment.trim()}>Send</button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Assets view ────────────────────────────────────────────────────────────
function AssetsView() {
    const [assets,  setAssets]  = useState([]);
    const [loading, setLoading] = useState(true);
    const [search,  setSearch]  = useState("");

    useEffect(() => {
        api.get("assets/?page_size=200")
            .then(r => setAssets(r.data.results ?? r.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const filtered = assets.filter(a =>
        a.asset_name?.toLowerCase().includes(search.toLowerCase()) ||
        a.asset_tag?.toLowerCase().includes(search.toLowerCase()) ||
        a.category?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="ap-view-page">
            <div className="ap-header">
                <div>
                    <h1 className="ap-title">Asset Inventory</h1>
                    <p className="ap-subtitle">{assets.length} assets in your company</p>
                </div>
                <div className="ap-search-wrap">
                    <FiSearch size={14} className="ap-search-icon" />
                    <input className="ap-search-input" placeholder="Search assets…"
                        value={search} onChange={e => setSearch(e.target.value)} />
                </div>
            </div>

            <div className="ap-content-scroll">
                {loading ? (
                    <div className="ap-view-loading">Loading assets…</div>
                ) : filtered.length === 0 ? (
                    <div className="ap-empty"><FiPackage size={36} color="#e2e8f0" /><p>No assets found.</p></div>
                ) : (
                    <div className="ap-asset-grid">
                        {filtered.map(a => (
                            <div key={a.id} className="ap-asset-card">
                                <div className="ap-asset-top">
                                    <div className="ap-asset-icon"><FiPackage size={18} color="#2563eb" /></div>
                                    <span style={{
                                        fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 12,
                                        background: ASSET_STATUS_BG[a.status] ?? "#f1f5f9",
                                        color: ASSET_STATUS_COLOR[a.status] ?? "#6b7280",
                                    }}>{a.status}</span>
                                </div>
                                <p className="ap-asset-name">{a.asset_name}</p>
                                <p className="ap-asset-tag">{a.asset_tag}</p>
                                <div className="ap-asset-meta-row">
                                    <span className="ap-asset-meta-item">{a.category}</span>
                                    {a.department_name && <span className="ap-asset-meta-item">{a.department_name}</span>}
                                </div>
                                {a.assigned_to_name && (
                                    <p className="ap-asset-assigned">Assigned to: <strong>{a.assigned_to_name}</strong></p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Knowledge Base view ────────────────────────────────────────────────────
function KnowledgeView() {
    const [articles, setArticles] = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [search,   setSearch]   = useState("");
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        api.get("knowledge-base/?page_size=100")
            .then(r => setArticles(r.data.results ?? r.data ?? []))
            .catch(() => setArticles([]))
            .finally(() => setLoading(false));
    }, []);

    const filtered = articles.filter(a =>
        a.title?.toLowerCase().includes(search.toLowerCase()) ||
        a.content?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="ap-view-page">
            <div className="ap-header">
                <div>
                    <h1 className="ap-title">Knowledge Base</h1>
                    <p className="ap-subtitle">{articles.length} articles available</p>
                </div>
                <div className="ap-search-wrap">
                    <FiSearch size={14} className="ap-search-icon" />
                    <input className="ap-search-input" placeholder="Search articles…"
                        value={search} onChange={e => setSearch(e.target.value)} />
                </div>
            </div>

            <div className="ap-content-scroll" style={{ display: "flex", gap: 0 }}>
                <div style={{ flex: 1, overflowY: "auto", padding: "16px 28px", display: "flex", flexDirection: "column", gap: 10 }}>
                    {loading ? (
                        <div className="ap-view-loading">Loading…</div>
                    ) : filtered.length === 0 ? (
                        <div className="ap-empty"><FiBook size={36} color="#e2e8f0" /><p>No articles found.</p></div>
                    ) : filtered.map(a => (
                        <div key={a.id}
                            className={`ap-kb-row${selected?.id === a.id ? " ap-kb-row-active" : ""}`}
                            onClick={() => setSelected(a)}>
                            <div className="ap-kb-icon"><FiBook size={14} color="#2563eb" /></div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p className="ap-kb-title">{a.title}</p>
                                <p className="ap-kb-meta">{a.category ?? "General"} · {fmtDate(a.created_at)}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {selected && (
                    <div className="ap-kb-detail">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0, lineHeight: 1.4 }}>{selected.title}</h2>
                            <button className="ap-detail-close" onClick={() => setSelected(null)}><FiX size={16} /></button>
                        </div>
                        <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16 }}>{selected.category ?? "General"} · {fmtDate(selected.created_at)}</p>
                        <p style={{ fontSize: 13.5, color: "#374151", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{selected.content}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Profile view ───────────────────────────────────────────────────────────
function ProfileView({ profile, setProfile }) {
    const [editing, setEditing] = useState(false);
    const [form,    setForm]    = useState({ first_name: "", last_name: "", location: "" });
    const [saving,  setSaving]  = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (profile) setForm({ first_name: profile.first_name ?? "", last_name: profile.last_name ?? "", location: profile.location ?? "" });
    }, [profile]);

    const handleSave = async () => {
        setSaving(true);
        setSuccess(false);
        try {
            const r = await api.patch(`accounts/users/${profile.id}/`, form);
            setProfile(prev => ({ ...prev, ...r.data }));
            setEditing(false);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch {}
        finally { setSaving(false); }
    };

    if (!profile) return <div className="ap-view-loading">Loading…</div>;

    const ROLE_COLOR = { admin: "#7c3aed", agent: "#2563eb", employee: "#16a34a" };

    return (
        <div className="ap-view-page">
            <div className="ap-header">
                <div>
                    <h1 className="ap-title">My Profile</h1>
                    <p className="ap-subtitle">View and update your account details</p>
                </div>
            </div>
            <div className="ap-content-scroll">
                <div className="ap-profile-card">
                    {success && (
                        <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#16a34a", marginBottom: 20 }}>
                            Profile updated successfully.
                        </div>
                    )}

                    <div className="ap-profile-top">
                        <div className="ap-profile-avatar">
                            {initials(`${profile.first_name} ${profile.last_name}`)}
                        </div>
                        <div>
                            <p className="ap-profile-name">{profile.first_name} {profile.last_name}</p>
                            <p className="ap-profile-email">{profile.email}</p>
                            <span style={{
                                display: "inline-block", marginTop: 6,
                                fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 12,
                                background: (ROLE_COLOR[profile.role] ?? "#6b7280") + "18",
                                color: ROLE_COLOR[profile.role] ?? "#6b7280",
                            }}>{profile.role?.toUpperCase()}</span>
                        </div>
                        <button className="ap-profile-edit-btn" onClick={() => setEditing(e => !e)}>
                            <FiEdit2 size={14} /> {editing ? "Cancel" : "Edit"}
                        </button>
                    </div>

                    <div className="ap-profile-fields">
                        <div className="ap-profile-field">
                            <label className="ap-profile-label">First Name</label>
                            {editing
                                ? <input className="ap-profile-input" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
                                : <p className="ap-profile-val">{profile.first_name || "—"}</p>
                            }
                        </div>
                        <div className="ap-profile-field">
                            <label className="ap-profile-label">Last Name</label>
                            {editing
                                ? <input className="ap-profile-input" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
                                : <p className="ap-profile-val">{profile.last_name || "—"}</p>
                            }
                        </div>
                        <div className="ap-profile-field">
                            <label className="ap-profile-label">Email</label>
                            <p className="ap-profile-val" style={{ color: "#94a3b8" }}>{profile.email}</p>
                        </div>
                        <div className="ap-profile-field">
                            <label className="ap-profile-label">Location</label>
                            {editing
                                ? <input className="ap-profile-input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Mumbai Office" />
                                : <p className="ap-profile-val">{profile.location || "—"}</p>
                            }
                        </div>
                        <div className="ap-profile-field">
                            <label className="ap-profile-label">Department</label>
                            <p className="ap-profile-val">{profile.department ?? "—"}</p>
                        </div>
                        <div className="ap-profile-field">
                            <label className="ap-profile-label">Status</label>
                            <p className="ap-profile-val">{profile.status ?? "—"}</p>
                        </div>
                    </div>

                    {editing && (
                        <button className="ap-resolve-btn" style={{ marginTop: 20 }} onClick={handleSave} disabled={saving}>
                            <FiSave size={14} /> {saving ? "Saving…" : "Save Changes"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Main AgentPortal ───────────────────────────────────────────────────────
export default function AgentPortal() {
    const navigate = useNavigate();
    const [profile,   setProfile]   = useState(null);
    const [tickets,   setTickets]   = useState([]);
    const [loading,   setLoading]   = useState(true);
    const [initError, setInitError] = useState(null);
    const [activeNav, setActiveNav] = useState("tickets");

    useEffect(() => {
        Promise.all([
            api.get("accounts/profile/"),
            api.get("tickets/?page_size=100"),
        ]).then(([p, t]) => {
            setProfile(p.data ?? null);
            setTickets(Array.isArray(t.data.results) ? t.data.results : []);
        }).catch(err => {
            setInitError(err?.response?.status ?? "network");
        }).finally(() => setLoading(false));
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    const open     = tickets.filter(t => t.status === "open").length;
    const inProg   = tickets.filter(t => t.status === "in_progress").length;
    const resolved = tickets.filter(t => t.status === "resolved").length;

    if (loading) return <div className="ap-loading">Loading…</div>;

    if (initError) return (
        <div className="ap-loading" style={{ flexDirection: "column", gap: 12 }}>
            <p style={{ color: "#ef4444", fontWeight: 600 }}>Failed to load portal (error {initError})</p>
            <button onClick={() => { localStorage.clear(); navigate("/login"); }}
                style={{ padding: "8px 18px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
                Back to Login
            </button>
        </div>
    );

    return (
        <div className="ap-root">

            {/* ── Sidebar ── */}
            <aside className="ap-sidebar">
                <div className="ap-brand">
                    <span className="ap-brand-icon">T</span>
                    <div>
                        <p className="ap-brand-name">TickDesk</p>
                        <p className="ap-brand-role">Agent Portal</p>
                    </div>
                </div>

                <div className="ap-agent-card">
                    <div className="ap-agent-avatar">{initials(profile ? `${profile.first_name} ${profile.last_name}` : "")}</div>
                    <div style={{ minWidth: 0 }}>
                        <p className="ap-agent-name">{profile?.first_name} {profile?.last_name}</p>
                        <p className="ap-agent-email">{profile?.email}</p>
                    </div>
                </div>

                {/* Nav links */}
                <nav className="ap-nav">
                    {NAV.map(({ key, label, Icon }) => (
                        <button key={key}
                            className={`ap-nav-item${activeNav === key ? " ap-nav-item-active" : ""}`}
                            onClick={() => setActiveNav(key)}>
                            <Icon size={16} />
                            <span>{label}</span>
                        </button>
                    ))}
                </nav>

                {/* Ticket stats — only show on tickets view */}
                {activeNav === "tickets" && (
                    <div className="ap-stats">
                        <div className="ap-stat"><FiClock size={16} /><span>{open} Open</span></div>
                        <div className="ap-stat"><FiRefreshCcw size={16} /><span>{inProg} In Progress</span></div>
                        <div className="ap-stat ap-stat-green"><FiCheckCircle size={16} /><span>{resolved} Resolved</span></div>
                    </div>
                )}

                <button className="ap-logout-btn" onClick={handleLogout}>
                    <FiLogOut size={15} /> Logout
                </button>
            </aside>

            {/* ── Content ── */}
            <div className="ap-body">
                {activeNav === "tickets"   && <TicketsView profile={profile} />}
                {activeNav === "assets"    && <AssetsView />}
                {activeNav === "knowledge" && <KnowledgeView />}
                {activeNav === "profile"   && <ProfileView profile={profile} setProfile={setProfile} />}
            </div>
        </div>
    );
}
