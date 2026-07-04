import "./Tickets.css";

import {
    FiInfo,
    FiShare2,
    FiMapPin,
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

// ─── Static data ──────────────────────────────────────────────────────────────

const activityLogs = [
    {
        Icon: FiCheckCircle,
        color: "#2563eb",
        text: (
            <>
                Status changed to{" "}
                <span className="log-highlight-blue">In Progress</span>{" "}
                by <strong>David Chen</strong>
            </>
        ),
        time: "Oct 25, 2023 • 2:10 PM",
    },
    {
        Icon: FiUser,
        color: "#7c3aed",
        text: (
            <>
                Ticket assigned to <strong>David Chen</strong> by Administrator
            </>
        ),
        time: "Oct 24, 2023 • 3:45 PM",
    },
    {
        Icon: FiAlertCircle,
        color: "#6b7280",
        text: (
            <>
                Ticket created by <strong>Rohit Sharma</strong>
            </>
        ),
        time: "Oct 24, 2023 • 11:32 AM",
    },
];

const attachments = [
    { name: "screenshot_error_1004.png", size: "2.4 MB",  type: "image" },
    { name: "vpn_logs.txt",              size: "12 KB",   type: "file"  },
];

const messages = [
    {
        initials: "DC",
        avatarColor: "#2563eb",
        text: "Hello Rohit, I've seen your log files. It looks like a protocol mismatch in the new macOS update. Let me check the config.",
        sender: "DAVID",
        time: "2:14 PM",
        type: "sent",
    },
    {
        initials: "RS",
        avatarColor: "#6b7280",
        text: "Thanks David. Should I try downgrading the client or is there a patch?",
        sender: "ROHIT",
        time: "2:16 PM",
        type: "received",
    },
];

// ─── Ticket Detail Page ────────────────────────────────────────────────────────

function TicketDetail() {
    return (
        <div className="ticket-page">

            {/* ── Ticket Header ── */}
            <div className="ticket-header">

                <div className="ticket-header-left">
                    <div className="ticket-id-row">
                        <h1 className="ticket-id">TK-1048</h1>
                        <span className="tbadge tbadge-progress">IN PROGRESS</span>
                        <span className="tbadge tbadge-high">
                            <span className="tbadge-exclaim">!</span> HIGH PRIORITY
                        </span>
                    </div>
                    <p className="ticket-created">
                        Created on Oct 24, 2023 &bull; Assigned to{" "}
                        <a href="#" className="assignee-link">David Chen</a>
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

                        {/* Subject */}
                        <div className="tf-group">
                            <label className="tf-label">SUBJECT</label>
                            <p className="tf-subject">Unable to connect to Global VPN</p>
                        </div>

                        {/* Category + Department */}
                        <div className="tf-row">
                            <div className="tf-group">
                                <label className="tf-label">CATEGORY</label>
                                <p className="tf-value tf-icon-val">
                                    <FiShare2 size={13} />
                                    Network
                                </p>
                            </div>
                            <div className="tf-group">
                                <label className="tf-label">DEPARTMENT</label>
                                <p className="tf-value">Information Technology</p>
                            </div>
                        </div>

                        {/* Requester + Location */}
                        <div className="tf-row">
                            <div className="tf-group">
                                <label className="tf-label">REQUESTER</label>
                                <div className="tf-requester">
                                    <div className="req-avatar">RS</div>
                                    <div>
                                        <p className="tf-name">Rohit Sharma</p>
                                        <p className="tf-email">rohit.s@tickdesk.ent</p>
                                    </div>
                                </div>
                            </div>
                            <div className="tf-group">
                                <label className="tf-label">LOCATION</label>
                                <p className="tf-value tf-icon-val">
                                    <FiMapPin size={13} />
                                    Raipur Office, HQ
                                </p>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="tf-group">
                            <label className="tf-label">DESCRIPTION</label>
                            <div className="tf-description">
                                <p>
                                    User reports that since the system update yesterday (macOS Sonoma 14.1),
                                    the GlobalProtect VPN client fails to establish a secure tunnel.
                                    It stucks at &ldquo;Connecting&rdquo; and eventually times out with Error 1004.
                                </p>
                                <p>
                                    Steps taken so far: Restarted machine, re-installed client, flushed DNS cache.
                                    Still persistent on corporate and home Wi-Fi.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Activity + Attachments */}
                    <div className="ticket-bottom-grid">

                        {/* Activity Logs */}
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
                                            <log.Icon
                                                size={15}
                                                style={{ color: log.color }}
                                                className="log-icon"
                                            />
                                            {i < activityLogs.length - 1 && (
                                                <span className="log-line" />
                                            )}
                                        </div>
                                        <div className="log-body">
                                            <p className="log-text">{log.text}</p>
                                            <p className="log-time">{log.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Attachments */}
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
                                            {a.type === "image"
                                                ? <FiImage size={18} />
                                                : <FiFile size={18} />}
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
                                    RS
                                    <span className="p-online-dot" />
                                </div>
                                <div className="p-info">
                                    <p className="p-name">Rohit Sharma</p>
                                    <p className="p-role">Requester</p>
                                </div>
                            </div>
                            <div className="participant-item">
                                <div className="p-avatar p-avatar-blue">
                                    DC
                                    <span className="p-online-dot" />
                                </div>
                                <div className="p-info">
                                    <p className="p-name">David Chen</p>
                                    <p className="p-role">Engineer (Assigned)</p>
                                </div>
                            </div>
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
                                    <div className={`chat-bubble ${msg.type}-bubble`}>
                                        {msg.text}
                                    </div>
                                    <p className="chat-meta">
                                        {msg.sender} &bull; {msg.time}
                                    </p>
                                </div>
                            ))}

                            {/* Typing indicator */}
                            <div className="typing-row">
                                <div className="typing-dots">
                                    <span /><span /><span />
                                </div>
                                <em className="typing-label">David is typing...</em>
                            </div>
                        </div>

                        {/* Quick action chips */}
                        <div className="chat-quick-chips">
                            <button className="quick-chip">Request Info</button>
                            <button className="quick-chip">Escalate</button>
                            <button className="quick-chip">Transfer</button>
                        </div>

                        {/* Input area */}
                        <div className="chat-input-area">
                            <input
                                type="text"
                                className="chat-input"
                                placeholder="Type a message..."
                            />
                            <div className="chat-input-footer">
                                <div className="chat-input-icons">
                                    <button className="chat-icon-btn"><FiPaperclip size={20} /></button>
                                    <button className="chat-icon-btn"><FiSmile size={20} /></button>
                                    <button className="chat-icon-btn"><FiImage size={20} /></button>
                                </div>
                                <button className="send-btn">
                                    Send <FiSend size={13} />
                                </button>
                            </div>
                        </div>

                    </div>

                </aside>

            </div>

        </div>
    );
}

export default TicketDetail;
