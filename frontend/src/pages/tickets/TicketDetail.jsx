import "./Tickets.css";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api";

import {
    FiInfo,
    FiShare2,
    FiRefreshCcw,
    FiPaperclip,
    FiEdit2,
    FiCheckCircle,
    FiUserPlus,
    FiMessageSquare,
    FiSend,
    FiSmile,
    FiImage,
    FiFile,
    FiAlertCircle,
    FiUser,
    FiBookmark,
    FiLink,
    FiList,
} from "react-icons/fi";

// ─── Static sidebar data (no backend model yet) ───────────────────────────────

const activityLogs = [
    { Icon: FiCheckCircle, color: "#2563eb", text: <>Status changed to <span className="log-highlight-blue">In Progress</span> by <strong>Admin</strong></>,  time: "—" },
    { Icon: FiUser,        color: "#7c3aed", text: <>Ticket assigned by Administrator</>,                                                                        time: "—" },
    { Icon: FiAlertCircle, color: "#6b7280", text: <>Ticket created</>,                                                                                          time: "—" },
];

const attachments = [
    { name: "screenshot_error.png", size: "2.4 MB", type: "image" },
    { name: "logs.txt",             size: "12 KB",  type: "file"  },
];

const messages = [
    { initials: "AD", avatarColor: "#2563eb", text: "Hello, I'm looking into this issue now.", sender: "ADMIN", time: "—", type: "sent"     },
    { initials: "U",  avatarColor: "#6b7280", text: "Thanks, please let me know what you find.", sender: "USER",  time: "—", type: "received" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusBadgeClass = { open: "tbadge-open", in_progress: "tbadge-progress", resolved: "tbadge-resolved", closed: "tbadge-closed" };
const priorityBadgeClass = { low: "tbadge-low", medium: "tbadge-medium", high: "tbadge-high", critical: "tbadge-critical" };

function fmtDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Ticket Detail Page ────────────────────────────────────────────────────────

function TicketDetail() {
    const { id }  = useParams();
    const [ticket, setTicket] = useState(null);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get(`tickets/${id}/`);
                setTicket(res.data);
            } catch (err) {
                if (err.response?.status === 404) setNotFound(true);
                else console.error("Ticket detail error:", err);
            }
        };
        load();
    }, [id]);

    if (notFound) {
        return (
            <div className="ticket-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
                <p style={{ color: "#94a3b8", fontSize: "1.1rem" }}>Ticket not found.</p>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="ticket-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
                <p style={{ color: "#94a3b8", fontSize: "1.1rem" }}>Loading…</p>
            </div>
        );
    }

    const statusLabel   = ticket.status_display   ?? ticket.status;
    const priorityLabel = ticket.priority_display ?? ticket.priority;
    const sBadge = statusBadgeClass[ticket.status]   ?? "tbadge-open";
    const pBadge = priorityBadgeClass[ticket.priority] ?? "tbadge-medium";

    const requesterName = ticket.created_by_name  ?? "—";
    const assigneeName  = ticket.assigned_to_name ?? "Unassigned";
    const deptName      = ticket.department_name  ?? "—";

    const requesterInitials = requesterName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    const assigneeInitials  = assigneeName === "Unassigned" ? "?" : assigneeName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

    return (
        <div className="ticket-page">

            {/* ── Ticket Header ── */}
            <div className="ticket-header">
                <div className="ticket-header-left">
                    <div className="ticket-id-row">
                        <h1 className="ticket-id">{ticket.ticket_number}</h1>
                        <span className={`tbadge ${sBadge}`}>{statusLabel.toUpperCase()}</span>
                        <span className={`tbadge ${pBadge}`}>
                            <span className="tbadge-exclaim">!</span> {priorityLabel.toUpperCase()} PRIORITY
                        </span>
                    </div>
                    <p className="ticket-created">
                        Created on {fmtDate(ticket.created_at)} &bull; Assigned to{" "}
                        <a href="#" className="assignee-link">{assigneeName}</a>
                    </p>
                </div>

                <div className="ticket-header-actions">
                    <button className="th-btn th-btn-outline">
                        <FiUserPlus size={14} /> Assign
                    </button>
                    <button className="th-btn th-btn-outline">
                        <FiEdit2 size={14} /> Edit
                    </button>
                    <button className="th-btn th-btn-resolve">
                        <FiCheckCircle size={14} /> Resolve
                    </button>
                </div>
            </div>

            {/* ── Content ── */}
            <div className="ticket-content">

                {/* ── Left Column ── */}
                <div className="ticket-left">

                    {/* Ticket Information */}
                    <div className="t-card">
                        <div className="t-card-heading">
                            <FiInfo className="t-heading-icon" />
                            <h2>Ticket Information</h2>
                        </div>
                        <hr className="t-divider" />

                        <div className="tf-group">
                            <label className="tf-label">SUBJECT</label>
                            <p className="tf-subject">{ticket.title}</p>
                        </div>

                        <div className="tf-row">
                            <div className="tf-group">
                                <label className="tf-label">CATEGORY</label>
                                <p className="tf-value tf-icon-val">
                                    <FiShare2 size={13} />
                                    General
                                </p>
                            </div>
                            <div className="tf-group">
                                <label className="tf-label">DEPARTMENT</label>
                                <p className="tf-value">{deptName}</p>
                            </div>
                        </div>

                        <div className="tf-row">
                            <div className="tf-group">
                                <label className="tf-label">REQUESTER</label>
                                <div className="tf-requester">
                                    <div className="req-avatar">{requesterInitials}</div>
                                    <div>
                                        <p className="tf-name">{requesterName}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="tf-group">
                                <label className="tf-label">ASSIGNED TO</label>
                                <div className="tf-requester">
                                    <div className="req-avatar" style={{ background: "#eff6ff", color: "#2563eb" }}>{assigneeInitials}</div>
                                    <div>
                                        <p className="tf-name">{assigneeName}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="tf-group">
                            <label className="tf-label">DESCRIPTION</label>
                            <div className="tf-description">
                                <p>{ticket.description || "No description provided."}</p>
                            </div>
                        </div>
                    </div>

                    {/* Activity + Attachments */}
                    <div className="ticket-bottom-grid">

                        <div className="t-card">
                            <div className="t-card-heading">
                                <FiRefreshCcw className="t-heading-icon" />
                                <h2>Activity Logs</h2>
                            </div>
                            <hr className="t-divider" />
                            <div className="activity-log-list">
                                {activityLogs.map((log, i) => (
                                    <div key={i} className="log-item">
                                        <div className="log-icon-col">
                                            <log.Icon size={15} style={{ color: log.color }} className="log-icon" />
                                            {i < activityLogs.length - 1 && <span className="log-line" />}
                                        </div>
                                        <div className="log-body">
                                            <p className="log-text">{log.text}</p>
                                            <p className="log-time">{log.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="t-card">
                            <div className="t-card-heading">
                                <FiPaperclip className="t-heading-icon" />
                                <h2>Attachments</h2>
                            </div>
                            <hr className="t-divider" />
                            <div className="attachment-list">
                                {attachments.map((a, i) => (
                                    <div key={i} className="attachment-item">
                                        <div className={`att-thumb att-${a.type}`}>
                                            {a.type === "image" ? <FiImage size={18} /> : <FiFile size={18} />}
                                        </div>
                                        <div className="att-info">
                                            <p className="att-name">{a.name}</p>
                                            <p className="att-size">{a.size}</p>
                                        </div>
                                    </div>
                                ))}
                                <button className="add-attachment-btn">
                                    <FiPaperclip size={13} /> Add Attachment
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* Internal Notes */}
                    <div className="t-card">
                        <div className="notes-header-row">
                            <div className="t-card-heading" style={{ marginBottom: 0 }}>
                                <FiBookmark className="t-heading-icon notes-icon" />
                                <h2>Internal Notes</h2>
                            </div>
                            <span className="visibility-badge">Visibility: Agents Only</span>
                        </div>

                        <div className="notes-toolbar">
                            <button className="toolbar-btn" title="Bold"><strong>B</strong></button>
                            <button className="toolbar-btn toolbar-italic" title="Italic"><em>I</em></button>
                            <button className="toolbar-btn" title="Link"><FiLink size={24} strokeWidth={3.5} /></button>
                            <button className="toolbar-btn" title="List"><FiList size={24} strokeWidth={3.5} /></button>
                        </div>

                        <textarea
                            className="notes-textarea"
                            placeholder="Add a private note for other support agents..."
                            rows={5}
                        />
                    </div>

                </div>

                {/* ── Right Sidebar ── */}
                <aside className="ticket-right">

                    {/* Participants */}
                    <div className="t-card">
                        <p className="sidebar-section-label">PARTICIPANTS</p>
                        <div className="participants-list">
                            <div className="participant-item">
                                <div className="p-avatar p-avatar-gray">
                                    {requesterInitials}
                                    <span className="p-online-dot" />
                                </div>
                                <div className="p-info">
                                    <p className="p-name">{requesterName}</p>
                                    <p className="p-role">Requester</p>
                                </div>
                            </div>
                            {assigneeName !== "Unassigned" && (
                                <div className="participant-item">
                                    <div className="p-avatar p-avatar-blue">
                                        {assigneeInitials}
                                        <span className="p-online-dot" />
                                    </div>
                                    <div className="p-info">
                                        <p className="p-name">{assigneeName}</p>
                                        <p className="p-role">Assigned Agent</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Live Conversation */}
                    <div className="t-card chat-card">
                        <div className="chat-header">
                            <FiMessageSquare size={15} className="chat-header-icon" />
                            <h2>Live Conversation</h2>
                            <span className="chat-online-dot" />
                        </div>

                        <div className="chat-messages">
                            {messages.map((msg, i) => (
                                <div key={i} className={`chat-msg ${msg.type}`}>
                                    <div className={`chat-bubble ${msg.type}-bubble`}>{msg.text}</div>
                                    <p className="chat-meta">{msg.sender} &bull; {msg.time}</p>
                                </div>
                            ))}
                            <div className="typing-row">
                                <div className="typing-dots"><span /><span /><span /></div>
                                <em className="typing-label">Agent is typing...</em>
                            </div>
                        </div>

                        <div className="chat-quick-chips">
                            <button className="quick-chip">Request Info</button>
                            <button className="quick-chip">Escalate</button>
                            <button className="quick-chip">Transfer</button>
                        </div>

                        <div className="chat-input-area">
                            <input type="text" className="chat-input" placeholder="Type a message..." />
                            <div className="chat-input-footer">
                                <div className="chat-input-icons">
                                    <button className="chat-icon-btn"><FiPaperclip size={20} /></button>
                                    <button className="chat-icon-btn"><FiSmile size={20} /></button>
                                    <button className="chat-icon-btn"><FiImage size={20} /></button>
                                </div>
                                <button className="send-btn">Send <FiSend size={13} /></button>
                            </div>
                        </div>
                    </div>

                </aside>

            </div>

        </div>
    );
}

export default TicketDetail;
