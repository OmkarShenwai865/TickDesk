import "./Tickets.css";
import "./TicketList.css";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api";

import {
    FiInfo,
    FiRefreshCcw,
    FiPaperclip,
    FiEdit2,
    FiCheckCircle,
    FiUserPlus,
    FiMessageSquare,
    FiSend,
    FiImage,
    FiFile,
    FiAlertCircle,
    FiUser,
    FiX,
    FiDownload,
    FiTag,
    FiClock,
    FiEye,
} from "react-icons/fi";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusBadgeClass   = { open: "tbadge-open", in_progress: "tbadge-progress", resolved: "tbadge-resolved", closed: "tbadge-closed" };
const priorityBadgeClass = { low: "tbadge-low", medium: "tbadge-medium", high: "tbadge-high", critical: "tbadge-critical" };

function fmtDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtTime(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " at " +
        d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatBytes(bytes) {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function initials(name) {
    if (!name || name === "Unassigned") return "?";
    return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function getUrlKind(name) {
    const ext = name.split('.').pop().toLowerCase();
    if (['png','jpg','jpeg','gif','webp'].includes(ext)) return "image";
    if (ext === 'pdf')                                   return "pdf";
    if (['mp4','mov','avi','webm','mkv'].includes(ext))  return "video";
    if (['txt','csv'].includes(ext))                     return "text";
    return "other";
}

// ─── Attachment Preview Overlay ───────────────────────────────────────────────

function AttachmentPreviewOverlay({ attachment, onClose }) {
    const kind = getUrlKind(attachment.original_name);
    const canZoom = kind === "image" || kind === "pdf";
    const [zoom, setZoom] = useState(1);
    const bodyRef = useRef(null);
    const MIN_ZOOM = 0.25, MAX_ZOOM = 4, STEP = 0.25;

    const zoomIn  = useCallback(() => setZoom(z => Math.min(MAX_ZOOM, parseFloat((z + STEP).toFixed(2)))), []);
    const zoomOut = useCallback(() => setZoom(z => Math.max(MIN_ZOOM, parseFloat((z - STEP).toFixed(2)))), []);

    useEffect(() => {
        const el = bodyRef.current;
        if (!el || !canZoom) return;
        const onWheel = (e) => { if (!e.ctrlKey) return; e.preventDefault(); e.deltaY < 0 ? zoomIn() : zoomOut(); };
        el.addEventListener("wheel", onWheel, { passive: false });
        return () => el.removeEventListener("wheel", onWheel);
    }, [canZoom, zoomIn, zoomOut]);

    return (
        <div className="fpv-overlay" onClick={onClose}>
            <div className="fpv-shell" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="fpv-header">
                    <span className="fpv-filename">{attachment.original_name}</span>
                    {canZoom && (
                        <div className="fpv-zoom-bar">
                            <button className="fpv-zoom-btn" onClick={zoomOut} disabled={zoom <= MIN_ZOOM}>−</button>
                            <span className="fpv-zoom-level" onClick={() => setZoom(1)} title="Click to reset">{Math.round(zoom * 100)}%</span>
                            <button className="fpv-zoom-btn" onClick={zoomIn}  disabled={zoom >= MAX_ZOOM}>+</button>
                        </div>
                    )}
                    <div className="fpv-header-actions">
                        <a href={attachment.file_url} download={attachment.original_name} className="fpv-btn" title="Download">
                            <FiDownload size={15} />
                        </a>
                        <button className="fpv-btn fpv-close-btn" onClick={onClose} title="Close">
                            <FiX size={15} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="fpv-body" ref={bodyRef}>
                    {kind === "image" && (
                        <div className="fpv-zoom-wrap" style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}>
                            <img src={attachment.file_url} alt={attachment.original_name} className="fpv-image" />
                        </div>
                    )}
                    {kind === "pdf" && (
                        <div className="fpv-zoom-wrap fpv-zoom-wrap-pdf" style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}>
                            <iframe src={attachment.file_url} title={attachment.original_name} className="fpv-iframe" />
                        </div>
                    )}
                    {kind === "video" && (
                        <video src={attachment.file_url} controls className="fpv-video">
                            Your browser does not support video playback.
                        </video>
                    )}
                    {kind === "other" && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 16 }}>
                            <FiFile size={48} color="#9ca3af" />
                            <p style={{ color: "#6b7280", fontSize: "14px" }}>Preview not available for this file type.</p>
                            <a href={attachment.file_url} download={attachment.original_name} className="ndm-btn-submit" style={{ textDecoration: "none" }}>
                                <FiDownload size={14} /> Download
                            </a>
                        </div>
                    )}
                </div>

                {canZoom && (
                    <div className="fpv-footer-hint">Ctrl + scroll to zoom &nbsp;·&nbsp; click % to reset</div>
                )}
            </div>
        </div>
    );
}

function activityIcon(action) {
    if (action.includes("created"))            return { Icon: FiTag,         color: "#2563eb" };
    if (action.includes("Status"))             return { Icon: FiCheckCircle, color: "#16a34a" };
    if (action.includes("Assigned"))           return { Icon: FiUser,        color: "#7c3aed" };
    if (action.includes("Priority"))           return { Icon: FiAlertCircle, color: "#ea580c" };
    if (action.includes("Attached"))           return { Icon: FiPaperclip,   color: "#0891b2" };
    return { Icon: FiRefreshCcw, color: "#6b7280" };
}

// ─── Assign Modal ─────────────────────────────────────────────────────────────

function AssignModal({ currentAssignee, onClose, onSave }) {
    const [users,    setUsers]    = useState([]);
    const [selected, setSelected] = useState(currentAssignee ?? "");
    const [saving,   setSaving]   = useState(false);

    useEffect(() => {
        api.get("accounts/users/?page_size=200").then(r => setUsers(r.data.results)).catch(() => {});
    }, []);

    const agents = users.filter(u => u.role === "agent");
    const admins = users.filter(u => u.role === "admin");

    const handleSave = async () => {
        setSaving(true);
        await onSave(selected || null);
        setSaving(false);
    };

    return (
        <div className="tdm-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="tdm-card">
                <div className="tdm-header">
                    <h2 className="tdm-title">Assign Ticket</h2>
                    <button className="tdm-close" onClick={onClose}><FiX size={18} /></button>
                </div>
                <div className="tdm-body">
                    <div className="ndm-field">
                        <label className="ndm-label">Assign To</label>
                        <select className="ndm-select" value={selected} onChange={e => setSelected(e.target.value)}>
                            <option value="">— Unassigned —</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.name || `${u.first_name} ${u.last_name}`.trim() || u.username} ({u.role})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="tdm-footer">
                    <button className="ndm-btn-cancel" onClick={onClose} disabled={saving}>Cancel</button>
                    <button className="ndm-btn-submit" onClick={handleSave} disabled={saving}>
                        {saving ? "Saving…" : "Assign"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

const EDIT_ALLOWED_EXTS = new Set([
    'pdf','png','jpg','jpeg','gif','webp','txt','csv','doc','docx','xls','xlsx','zip',
    'mp4','mov','avi','webm','mkv',
]);

function EditModal({ ticket, existingAttachments, onClose, onSaved }) {
    const [form,        setForm]        = useState({
        title:       ticket.title       ?? "",
        description: ticket.description ?? "",
        priority:    ticket.priority    ?? "medium",
        department:  ticket.department  ?? "",
        assigned_to: ticket.assigned_to ?? "",
    });
    const [users,       setUsers]       = useState([]);
    const [depts,       setDepts]       = useState([]);
    const [existing,    setExisting]    = useState(existingAttachments ?? []);
    const [deletedIds,  setDeletedIds]  = useState(new Set());
    const [newFiles,    setNewFiles]    = useState([]);
    const [dragOver,    setDragOver]    = useState(false);
    const [saving,      setSaving]      = useState(false);
    const [error,       setError]       = useState("");
    const fileInputRef = useRef(null);

    useEffect(() => {
        Promise.all([
            api.get("accounts/users/?page_size=200"),
            api.get("accounts/departments/?page_size=200"),
        ]).then(([u, d]) => {
            setUsers(u.data.results);
            setDepts(d.data.results);
        }).catch(() => {});
    }, []);

    const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }));

    const addFiles = (rawFiles) => {
        const arr = Array.from(rawFiles);
        if (!arr.length) return;
        const entries = arr.map((f, i) => {
            const ext = f.name.split('.').pop().toLowerCase();
            const fileError = !EDIT_ALLOWED_EXTS.has(ext) ? `".${ext}" not allowed` : null;
            return { file: f, id: `${f.name}-${f.size}-${Date.now()}-${i}`, error: fileError };
        });
        setNewFiles(prev => [...prev, ...entries]);
    };

    const removeFile = (id) => setNewFiles(prev => prev.filter(e => e.id !== id));

    const markDelete = (attId) => setDeletedIds(prev => new Set([...prev, attId]));
    const unmarkDelete = (attId) => setDeletedIds(prev => { const s = new Set(prev); s.delete(attId); return s; });

    const handleSave = async () => {
        if (!form.title.trim()) { setError("Title is required."); return; }
        if (newFiles.some(f => f.error)) { setError("Remove invalid files before saving."); return; }
        setSaving(true);
        try {
            // 1. Patch ticket fields
            const payload = {
                title:       form.title.trim(),
                description: form.description.trim(),
                priority:    form.priority,
                department:  form.department  ? Number(form.department)  : null,
                assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
            };
            const res = await api.patch(`tickets/${ticket.id}/`, payload);

            // 2. Delete removed existing attachments
            if (deletedIds.size) {
                await Promise.all([...deletedIds].map(attId =>
                    api.delete(`tickets/${ticket.id}/attachments/${attId}`)
                ));
            }

            // 3. Upload new attachments
            if (newFiles.length) {
                await Promise.all(newFiles.map(({ file }) => {
                    const fd = new FormData();
                    fd.append("file", file);
                    return api.post(`tickets/${ticket.id}/attachments/`, fd, {
                        headers: { "Content-Type": "multipart/form-data" },
                    });
                }));
            }

            onSaved(res.data);
            onClose();
        } catch (err) {
            const data = err.response?.data;
            setError(
                data?.detail ||
                (typeof data === "object" ? Object.values(data).flat().join(" ") : null) ||
                "Failed to save changes."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="tdm-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="tdm-card tdm-card-wide">
                <div className="tdm-header">
                    <h2 className="tdm-title">Edit Ticket</h2>
                    <button className="tdm-close" onClick={onClose}><FiX size={18} /></button>
                </div>

                <div className="tdm-body">
                    {error && <div className="ndm-err-banner">{error}</div>}

                    {/* Title */}
                    <div className="ndm-field">
                        <label className="ndm-label">Title <span className="ndm-required">*</span></label>
                        <input className="ndm-input" value={form.title} onChange={set("title")} />
                    </div>

                    {/* Description */}
                    <div className="ndm-field">
                        <label className="ndm-label">Description</label>
                        <textarea className="ndm-input ndm-textarea" rows={3} value={form.description} onChange={set("description")} />
                    </div>

                    {/* Priority + Department */}
                    <div className="tdm-row-2">
                        <div className="ndm-field">
                            <label className="ndm-label">Priority</label>
                            <select className="ndm-select" value={form.priority} onChange={set("priority")}>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                        <div className="ndm-field">
                            <label className="ndm-label">Department</label>
                            <select className="ndm-select" value={form.department ?? ""} onChange={set("department")}>
                                <option value="">— No Department —</option>
                                {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Assign To */}
                    <div className="ndm-field">
                        <label className="ndm-label">Assign To</label>
                        <select className="ndm-select" value={form.assigned_to ?? ""} onChange={set("assigned_to")}>
                            <option value="">— Unassigned —</option>
                            {users.filter(u => u.role === "agent").length > 0 && (
                                <optgroup label="Support Agents">
                                    {users.filter(u => u.role === "agent").map(u =>
                                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                    )}
                                </optgroup>
                            )}
                            {users.filter(u => u.role === "admin").length > 0 && (
                                <optgroup label="Escalate to Admin">
                                    {users.filter(u => u.role === "admin").map(u =>
                                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                    )}
                                </optgroup>
                            )}
                        </select>
                    </div>

                    {/* Existing Attachments */}
                    {existing.length > 0 && (
                        <div className="ndm-field">
                            <label className="ndm-label">Uploaded Files</label>
                            <ul className="tdm-file-list">
                                {existing.map((att) => {
                                    const removed = deletedIds.has(att.id);
                                    return (
                                        <li
                                            key={att.id}
                                            className={`tdm-file-item${removed ? " tdm-file-item-err" : ""}`}
                                            style={removed ? { opacity: 0.5, textDecoration: "line-through" } : {}}
                                        >
                                            <FiPaperclip size={14} className="tdm-file-icon" />
                                            <span className="tdm-file-name">{att.original_name}</span>
                                            <span className="tdm-file-size">{formatBytes(att.file_size)}</span>
                                            <button
                                                type="button"
                                                className="tdm-file-remove"
                                                style={removed ? { color: "#16a34a" } : { color: "#ef4444" }}
                                                onClick={() => removed ? unmarkDelete(att.id) : markDelete(att.id)}
                                                title={removed ? "Restore" : "Remove"}
                                            >
                                                {removed ? <FiRefreshCcw size={13} /> : <FiX size={13} />}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}

                    {/* New Attachments */}
                    <div className="ndm-field">
                        <label className="ndm-label">Add Attachments</label>
                        <div
                            className={`tdm-dropzone${dragOver ? " tdm-dropzone-active" : ""}`}
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <FiPaperclip size={16} className="tdm-drop-icon" />
                            <span className="tdm-drop-text">
                                Drop files or <span className="tdm-drop-link">browse</span>
                            </span>
                            <span className="tdm-drop-hint">PDF, images, video, docs, zip</span>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                style={{ display: "none" }}
                                onChange={e => { addFiles(e.target.files); e.target.value = ""; }}
                            />
                        </div>

                        {newFiles.length > 0 && (
                            <ul className="tdm-file-list">
                                {newFiles.map(({ file, id, error: fe }) => (
                                    <li key={id} className={`tdm-file-item${fe ? " tdm-file-item-err" : ""}`}>
                                        <FiFile size={14} className="tdm-file-icon" />
                                        <span className="tdm-file-name">{file.name}</span>
                                        {fe
                                            ? <span className="tdm-file-err">{fe}</span>
                                            : <span className="tdm-file-size">{formatBytes(file.size)}</span>
                                        }
                                        <button
                                            type="button"
                                            className="tdm-file-remove"
                                            onClick={() => removeFile(id)}
                                            title="Remove"
                                        >
                                            <FiX size={13} />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="tdm-footer">
                    <button className="ndm-btn-cancel" onClick={onClose} disabled={saving}>Cancel</button>
                    <button className="ndm-btn-submit" onClick={handleSave} disabled={saving}>
                        {saving ? "Saving…" : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Ticket Detail Page ────────────────────────────────────────────────────────

function TicketDetail() {
    const { id } = useParams();
    const role      = localStorage.getItem("role") || "employee";
    const myUserId  = parseInt(localStorage.getItem("user_id") || "0");
    const isAdmin   = role === "admin";
    const isAgent   = role === "agent";
    const canManage = isAdmin || isAgent;

    const [ticket,      setTicket]      = useState(null);
    const [activities,  setActivities]  = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [comments,    setComments]    = useState([]);
    const [notFound,    setNotFound]    = useState(false);

    const [commentText, setCommentText] = useState("");
    const [sending,     setSending]     = useState(false);
    const [resolving,   setResolving]   = useState(false);

    const [showAssign,      setShowAssign]      = useState(false);
    const [showEdit,        setShowEdit]        = useState(false);
    const [previewAtt,      setPreviewAtt]      = useState(null);

    const chatEndRef   = useRef(null);
    const pollRef      = useRef(null);
    const commentCount = useRef(0);

    const load = async () => {
        try {
            const [tkRes, actRes, attRes, comRes] = await Promise.all([
                api.get(`tickets/${id}/`),
                api.get(`tickets/${id}/activities/`),
                api.get(`tickets/${id}/attachments/`),
                api.get(`tickets/${id}/comments/`),
            ]);
            setTicket(tkRes.data);
            setActivities(actRes.data);
            setAttachments(attRes.data);
            setComments(comRes.data);
            commentCount.current = comRes.data.length;
        } catch (err) {
            if (err.response?.status === 404) setNotFound(true);
            else console.error("Ticket detail load error:", err);
        }
    };

    // Poll only for new comments — lightweight, skips if tab is hidden
    const pollComments = useCallback(async () => {
        if (document.visibilityState !== "visible") return;
        try {
            const res = await api.get(`tickets/${id}/comments/`);
            if (res.data.length !== commentCount.current) {
                commentCount.current = res.data.length;
                setComments(res.data);
            }
        } catch (_) {}
    }, [id]);

    const startPolling = useCallback(() => {
        if (pollRef.current) return;
        pollRef.current = setInterval(pollComments, 5000);
    }, [pollComments]);

    const stopPolling = useCallback(() => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    }, []);

    useEffect(() => { load(); }, [id]);

    // Start/stop polling based on tab visibility
    useEffect(() => {
        startPolling();

        const handleVisibility = () => {
            if (document.visibilityState === "visible") {
                pollComments(); // fetch immediately on tab focus
                startPolling();
            } else {
                stopPolling();
            }
        };

        document.addEventListener("visibilitychange", handleVisibility);
        return () => {
            stopPolling();
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, [startPolling, stopPolling, pollComments]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [comments]);

    if (notFound) return (
        <div className="ticket-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
            <p style={{ color: "#94a3b8", fontSize: "1.1rem" }}>Ticket not found.</p>
        </div>
    );

    if (!ticket) return (
        <div className="ticket-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
            <p style={{ color: "#94a3b8", fontSize: "1.1rem" }}>Loading…</p>
        </div>
    );

    const statusLabel   = ticket.status_display   ?? ticket.status;
    const priorityLabel = ticket.priority_display ?? ticket.priority;
    const sBadge = statusBadgeClass[ticket.status]     ?? "tbadge-open";
    const pBadge = priorityBadgeClass[ticket.priority] ?? "tbadge-medium";

    const requesterName = ticket.created_by_name  ?? "—";
    const assigneeName  = ticket.assigned_to_name ?? "Unassigned";
    const deptName      = ticket.department_name  ?? "—";

    const reqInitials = initials(requesterName);
    const asnInitials = initials(assigneeName);

    const isResolved = ticket.status === "resolved" || ticket.status === "closed";

    const handleResolve = async () => {
        setResolving(true);
        try {
            const res = await api.patch(`tickets/${id}/`, { status: "resolved" });
            setTicket(res.data);
            const actRes = await api.get(`tickets/${id}/activities/`);
            setActivities(actRes.data);
        } catch (err) { console.error(err); }
        finally { setResolving(false); }
    };

    const handleAssignSave = async (userId) => {
        try {
            const res = await api.patch(`tickets/${id}/`, { assigned_to: userId || null });
            setTicket(res.data);
            const actRes = await api.get(`tickets/${id}/activities/`);
            setActivities(actRes.data);
        } catch (err) { console.error(err); }
        setShowAssign(false);
    };

    const handleEditSaved = (updated) => {
        setTicket(updated);
        // Refresh both activities and attachments (new files may have been uploaded)
        Promise.all([
            api.get(`tickets/${id}/activities/`),
            api.get(`tickets/${id}/attachments/`),
        ]).then(([actRes, attRes]) => {
            setActivities(actRes.data);
            setAttachments(attRes.data);
        }).catch(() => {});
    };

    const handleSendComment = async (e) => {
        e.preventDefault();
        const text = commentText.trim();
        if (!text) return;
        setSending(true);
        try {
            const res = await api.post(`tickets/${id}/comments/`, { text });
            setComments(prev => [...prev, res.data]);
            setCommentText("");
        } catch (err) { console.error(err); }
        finally { setSending(false); }
    };

    return (
        <div className="ticket-page">

            {/* ── Modals ── */}
            {showAssign && (
                <AssignModal
                    currentAssignee={ticket.assigned_to}
                    onClose={() => setShowAssign(false)}
                    onSave={handleAssignSave}
                />
            )}
            {showEdit && (
                <EditModal
                    ticket={ticket}
                    existingAttachments={attachments}
                    onClose={() => setShowEdit(false)}
                    onSaved={handleEditSaved}
                />
            )}
            {previewAtt && (
                <AttachmentPreviewOverlay
                    attachment={previewAtt}
                    onClose={() => setPreviewAtt(null)}
                />
            )}

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
                        <span className="assignee-link">{assigneeName}</span>
                    </p>
                </div>

                {canManage && (
                    <div className="ticket-header-actions">
                        <button className="th-btn th-btn-outline" onClick={() => setShowAssign(true)}>
                            <FiUserPlus size={14} /> Assign
                        </button>
                        <button className="th-btn th-btn-outline" onClick={() => setShowEdit(true)}>
                            <FiEdit2 size={14} /> Edit
                        </button>
                        <button
                            className={`th-btn ${isResolved ? "th-btn-outline" : "th-btn-resolve"}`}
                            onClick={handleResolve}
                            disabled={isResolved || resolving}
                        >
                            <FiCheckCircle size={14} />
                            {resolving ? "Resolving…" : isResolved ? "Resolved" : "Resolve"}
                        </button>
                    </div>
                )}
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
                                <label className="tf-label">STATUS</label>
                                <p className="tf-value">
                                    <span className={`tbadge ${sBadge}`} style={{ fontSize: "11px" }}>
                                        {statusLabel.toUpperCase()}
                                    </span>
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
                                    <div className="req-avatar">{reqInitials}</div>
                                    <p className="tf-name">{requesterName}</p>
                                </div>
                            </div>
                            <div className="tf-group">
                                <label className="tf-label">ASSIGNED TO</label>
                                <div className="tf-requester">
                                    <div className="req-avatar" style={{ background: "#eff6ff", color: "#2563eb" }}>{asnInitials}</div>
                                    <p className="tf-name">{assigneeName}</p>
                                </div>
                            </div>
                        </div>

                        <div className="tf-row">
                            <div className="tf-group">
                                <label className="tf-label">CREATED</label>
                                <p className="tf-value">{fmtDate(ticket.created_at)}</p>
                            </div>
                            <div className="tf-group">
                                <label className="tf-label">LAST UPDATED</label>
                                <p className="tf-value">{fmtDate(ticket.updated_at)}</p>
                            </div>
                        </div>

                        <div className="tf-group">
                            <label className="tf-label">DESCRIPTION</label>
                            <div className="tf-description">
                                <p>{ticket.description || "No description provided."}</p>
                            </div>
                        </div>

                        <hr className="t-divider" />
                        <p className="tf-label" style={{ marginBottom: "10px" }}>PARTICIPANTS</p>
                        <div className="participants-list">
                            <div className="participant-item">
                                <div className="p-avatar p-avatar-gray">
                                    {reqInitials}
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
                                        {asnInitials}
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

                    {/* Activity + Attachments */}
                    <div className="ticket-bottom-grid">

                        {/* Activity Logs — visible to all roles */}
                        {true && (
                            <div className="t-card">
                                <div className="t-card-heading">
                                    <FiRefreshCcw className="t-heading-icon" />
                                    <h2>Activity Logs</h2>
                                </div>
                                <hr className="t-divider" />
                                <div className="activity-log-list">
                                    {activities.length === 0 ? (
                                        <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>No activity yet.</p>
                                    ) : activities.map((log, i) => {
                                        const { Icon, color } = activityIcon(log.action);
                                        return (
                                            <div key={log.id} className="log-item">
                                                <div className="log-icon-col">
                                                    <Icon size={15} style={{ color }} className="log-icon" />
                                                    {i < activities.length - 1 && <span className="log-line" />}
                                                </div>
                                                <div className="log-body">
                                                    <p className="log-text">
                                                        <strong>{log.action}</strong>
                                                        {log.actor_name && <> by <span className="log-highlight-blue">{log.actor_name}</span></>}
                                                    </p>
                                                    <p className="log-time">{fmtTime(log.created_at)}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Attachments */}
                        <div className="t-card">
                            <div className="t-card-heading">
                                <FiPaperclip className="t-heading-icon" />
                                <h2>Attachments</h2>
                                <span className="t-count-badge">{attachments.length}</span>
                            </div>
                            <hr className="t-divider" />
                            <div className="attachment-list">
                                {attachments.length === 0 ? (
                                    <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>No attachments.</p>
                                ) : attachments.map((a) => {
                                    const kind  = getUrlKind(a.original_name);
                                    const isImg = kind === "image";
                                    const canPreview = kind !== "other";
                                    return (
                                        <div key={a.id} className="attachment-item">
                                            <div className={`att-thumb ${isImg ? "att-image" : "att-file"}`}>
                                                {isImg ? <FiImage size={18} /> : <FiFile size={18} />}
                                            </div>
                                            <div className="att-info">
                                                <p className="att-name">{a.original_name}</p>
                                                <p className="att-size">{formatBytes(a.file_size)}</p>
                                            </div>
                                            <div className="att-actions">
                                                {canPreview && a.file_url && (
                                                    <button
                                                        className="att-action-btn att-preview-btn"
                                                        title="Preview"
                                                        onClick={() => setPreviewAtt(a)}
                                                    >
                                                        <FiEye size={16} />
                                                    </button>
                                                )}
                                                {a.file_url && (
                                                    <a href={a.file_url} download={a.original_name} className="att-action-btn att-download-btn" title="Download">
                                                        <FiDownload size={16} />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                    </div>

                    {/* Internal Notes — agents & admins only */}
                    {canManage && (
                        <div className="t-card">
                            <div className="notes-header-row">
                                <div className="t-card-heading" style={{ marginBottom: 0 }}>
                                    <FiClock className="t-heading-icon notes-icon" />
                                    <h2>Internal Notes</h2>
                                </div>
                                <span className="visibility-badge">Agents Only</span>
                            </div>
                            <textarea
                                className="notes-textarea"
                                placeholder="Add a private note for other support agents..."
                                rows={4}
                            />
                        </div>
                    )}

                </div>

                {/* ── Right Sidebar ── */}
                <aside className="ticket-right">

                    {/* Live Conversation (Comments) */}
                    <div className="t-card chat-card">
                        <div className="chat-header">
                            <FiMessageSquare size={15} className="chat-header-icon" />
                            <h2>Conversation</h2>
                            <span className="chat-online-dot" />
                        </div>

                        <div className="chat-messages">
                            {comments.length === 0 ? (
                                <p style={{ color: "#94a3b8", fontSize: "0.82rem", textAlign: "center", padding: "12px 0" }}>
                                    No messages yet. Start the conversation.
                                </p>
                            ) : comments.map((msg) => {
                                const isMine = msg.author === myUserId;
                                const type   = isMine ? "sent" : "received";
                                return (
                                    <div key={msg.id} className={`chat-msg ${type}`}>
                                        <div className={`chat-bubble ${type}-bubble`}>{msg.text}</div>
                                        <p className="chat-meta">
                                            {msg.author_name} &bull; {fmtTime(msg.created_at)}
                                        </p>
                                    </div>
                                );
                            })}
                            <div ref={chatEndRef} />
                        </div>

                        <form className="chat-input-area" onSubmit={handleSendComment}>
                            <input
                                type="text"
                                className="chat-input"
                                placeholder="Type a message..."
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                                disabled={sending}
                            />
                            <div className="chat-input-footer">
                                <div className="chat-input-icons" />
                                <button type="submit" className="send-btn" disabled={sending || !commentText.trim()}>
                                    {sending ? "…" : "Send"} <FiSend size={13} />
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Ticket Meta */}
                    <div className="t-card">
                        <p className="sidebar-section-label">TICKET META</p>
                        <div className="tmeta-list">
                            <div className="tmeta-row">
                                <span className="tmeta-key">Ticket ID</span>
                                <span className="tmeta-val">{ticket.ticket_number}</span>
                            </div>
                            <div className="tmeta-row">
                                <span className="tmeta-key">Priority</span>
                                <span className={`tbadge ${pBadge}`} style={{ fontSize: "10.5px", padding: "2px 8px" }}>
                                    {priorityLabel.toUpperCase()}
                                </span>
                            </div>
                            <div className="tmeta-row">
                                <span className="tmeta-key">Department</span>
                                <span className="tmeta-val">{deptName}</span>
                            </div>
                            <div className="tmeta-row">
                                <span className="tmeta-key">Comments</span>
                                <span className="tmeta-val">{comments.length}</span>
                            </div>
                            <div className="tmeta-row">
                                <span className="tmeta-key">Attachments</span>
                                <span className="tmeta-val">{attachments.length}</span>
                            </div>
                        </div>
                    </div>

                </aside>

            </div>

        </div>
    );
}

export default TicketDetail;
