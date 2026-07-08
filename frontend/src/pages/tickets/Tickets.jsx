import "./TicketList.css";
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

import {
    FiFilter,
    FiDownload,
    FiPlus,
    FiAlertCircle,
    FiClock,
    FiCheckCircle,
    FiMoreVertical,
    FiSearch,
    FiArrowLeft,
    FiArrowRight,
    FiBarChart2,
    FiUsers,
    FiUserPlus,
    FiSettings,
    FiTag,
    FiList,
    FiColumns,
    FiX,
    FiEye,
} from "react-icons/fi";

// ─── Config maps (keyed by raw API values) ────────────────────────────────────

const priorityConfig = {
    critical: { label: "Critical", bg: "#fef2f2", color: "#dc2626", dot: "#dc2626" },
    high:     { label: "High",     bg: "#fff7ed", color: "#ea580c", dot: "#ea580c" },
    medium:   { label: "Medium",   bg: "#fffbeb", color: "#d97706", dot: "#d97706" },
    low:      { label: "Low",      bg: "#f0fdf4", color: "#16a34a", dot: "#16a34a" },
};

const statusConfig = {
    open:        { label: "Open",        bg: "#eff6ff", color: "#2563eb" },
    in_progress: { label: "In Progress", bg: "#f0fdf4", color: "#16a34a" },
    resolved:    { label: "Resolved",    bg: "#f3f4f6", color: "#6b7280" },
    closed:      { label: "Closed",      bg: "#faf5ff", color: "#7c3aed" },
};

const kanbanColumns = [
    { key: "open",        label: "Open",        color: "#2563eb", headerBg: "#eff6ff" },
    { key: "in_progress", label: "In Progress", color: "#16a34a", headerBg: "#f0fdf4" },
    { key: "resolved",    label: "Resolved",    color: "#6b7280", headerBg: "#f3f4f6" },
    { key: "closed",      label: "Closed",      color: "#7c3aed", headerBg: "#faf5ff" },
];

const statusFilters = [
    { key: "",            label: "All"         },
    { key: "open",        label: "Open"        },
    { key: "in_progress", label: "In Progress" },
    { key: "resolved",    label: "Resolved"    },
    { key: "closed",      label: "Closed"      },
];

const quickActionDefs = [
    { icon: <FiPlus />,     label: "New Ticket",    key: "new"    },
    { icon: <FiUserPlus />, label: "Bulk Assign",   key: "bulk"   },
    { icon: <FiDownload />, label: "Export Report", key: "export" },
    { icon: <FiSettings />, label: "SLA Settings",  key: "sla"    },
];

const slaItems = [
    { label: "Within SLA", count: 203, color: "#16a34a" },
    { label: "At Risk",    count: 28,  color: "#d97706" },
    { label: "Breached",   count: 17,  color: "#dc2626" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
    });
}

// ─── Kanban Card ──────────────────────────────────────────────────────────────

function KanbanCard({ ticket, onClick }) {
    const p = priorityConfig[ticket.priority] ?? priorityConfig.medium;
    const assignee = ticket.assigned_to_name ?? "Unassigned";
    return (
        <div className="kb-card" onClick={onClick}>
            <div className="kb-card-top">
                <span className="kb-ticket-id">{ticket.ticket_number}</span>
                <span className="kb-priority-badge" style={{ background: p.bg, color: p.color }}>
                    <span className="kb-priority-dot" style={{ background: p.dot }} />
                    {p.label}
                </span>
            </div>
            <p className="kb-subject">{ticket.title}</p>
            <div className="kb-card-footer">
                <div className="kb-assignee">
                    <div className="kb-avatar">
                        {assignee === "Unassigned"
                            ? "?"
                            : assignee.split(" ").map(w => w[0]).join("").slice(0, 2)}
                    </div>
                    <span className="kb-assignee-name">{assignee}</span>
                </div>
                <span className="kb-date">{fmtDate(ticket.created_at)}</span>
            </div>
        </div>
    );
}

// ─── New Ticket Modal ─────────────────────────────────────────────────────────

const EMPTY_FORM = { title: "", description: "", priority: "medium", department: "", assigned_to: "" };

const ALLOWED_EXTS = new Set([
    'pdf','png','jpg','jpeg','gif','webp','txt','csv','doc','docx','xls','xlsx','zip',
    'mp4','mov','avi','webm','mkv',
]);
const TOTAL_MAX = 50 * 1024 * 1024; // 50 MB total across all attachments

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileKind(file) {
    if (file.type.startsWith("image/"))  return "image";
    if (file.type === "application/pdf") return "pdf";
    if (file.type.startsWith("video/"))  return "video";
    if (file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".csv")) return "text";
    return "other";
}

function FilePreviewOverlay({ entry, onClose }) {
    const [textContent, setTextContent] = useState(null);
    const [objUrl,      setObjUrl]      = useState(null);
    const [zoom,        setZoom]        = useState(1);
    const bodyRef = useRef(null);

    const canZoom = entry.kind === "image" || entry.kind === "pdf";
    const MIN_ZOOM = 0.25, MAX_ZOOM = 4, STEP = 0.25;

    const zoomIn    = useCallback(() => setZoom(z => Math.min(MAX_ZOOM, parseFloat((z + STEP).toFixed(2)))), []);
    const zoomOut   = useCallback(() => setZoom(z => Math.max(MIN_ZOOM, parseFloat((z - STEP).toFixed(2)))), []);
    const zoomReset = () => setZoom(1);

    // Ctrl + scroll wheel zoom
    useEffect(() => {
        const el = bodyRef.current;
        if (!el || !canZoom) return;
        const onWheel = (e) => {
            if (!e.ctrlKey) return;
            e.preventDefault();
            if (e.deltaY < 0) zoomIn(); else zoomOut();
        };
        el.addEventListener("wheel", onWheel, { passive: false });
        return () => el.removeEventListener("wheel", onWheel);
    }, [canZoom, zoomIn, zoomOut]);

    useEffect(() => {
        setZoom(1); // reset zoom when switching files
        const url = URL.createObjectURL(entry.file);
        setObjUrl(url);
        if (entry.kind === "text") {
            const reader = new FileReader();
            reader.onload = e => setTextContent(e.target.result);
            reader.readAsText(entry.file);
        }
        return () => URL.revokeObjectURL(url);
    }, [entry]);

    const handleDownload = () => {
        if (!objUrl) return;
        const a = document.createElement("a");
        a.href = objUrl;
        a.download = entry.file.name;
        a.click();
    };

    return (
        <div className="fpv-overlay" onClick={onClose}>
            <div className="fpv-shell" onClick={e => e.stopPropagation()}>

                {/* ── Header ── */}
                <div className="fpv-header">
                    <span className="fpv-filename">{entry.file.name}</span>

                    {canZoom && (
                        <div className="fpv-zoom-bar">
                            <button
                                className="fpv-zoom-btn"
                                onClick={zoomOut}
                                disabled={zoom <= MIN_ZOOM}
                                title="Zoom out"
                            >−</button>
                            <span
                                className="fpv-zoom-level"
                                onClick={zoomReset}
                                title="Click to reset zoom"
                            >{Math.round(zoom * 100)}%</span>
                            <button
                                className="fpv-zoom-btn"
                                onClick={zoomIn}
                                disabled={zoom >= MAX_ZOOM}
                                title="Zoom in"
                            >+</button>
                        </div>
                    )}

                    <div className="fpv-header-actions">
                        <button className="fpv-btn" onClick={handleDownload} title="Download">
                            <FiDownload size={15} />
                        </button>
                        <button className="fpv-btn fpv-close-btn" onClick={onClose} title="Close">
                            <FiX size={15} />
                        </button>
                    </div>
                </div>

                {/* ── Body ── */}
                <div className="fpv-body" ref={bodyRef}>
                    {!objUrl && <p className="fpv-loading">Loading…</p>}

                    {objUrl && entry.kind === "image" && (
                        <div
                            className="fpv-zoom-wrap"
                            style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
                        >
                            <img src={objUrl} alt={entry.file.name} className="fpv-image" />
                        </div>
                    )}

                    {objUrl && entry.kind === "pdf" && (
                        <div
                            className="fpv-zoom-wrap fpv-zoom-wrap-pdf"
                            style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
                        >
                            <iframe src={objUrl} title={entry.file.name} className="fpv-iframe" />
                        </div>
                    )}

                    {objUrl && entry.kind === "video" && (
                        <video src={objUrl} controls className="fpv-video">
                            Your browser does not support video playback.
                        </video>
                    )}

                    {entry.kind === "text" && (
                        textContent === null
                            ? <p className="fpv-loading">Reading file…</p>
                            : <pre className="fpv-text">{textContent}</pre>
                    )}
                </div>

                {/* ── Zoom hint ── */}
                {canZoom && (
                    <div className="fpv-footer-hint">
                        Ctrl + scroll to zoom &nbsp;·&nbsp; click % to reset
                    </div>
                )}
            </div>
        </div>
    );
}

function NewTicketModal({ onClose, onCreated }) {
    const role = localStorage.getItem("role") || "employee";
    const isEmployee = role === "employee";
    const [form,        setForm]        = useState(EMPTY_FORM);
    const [users,       setUsers]       = useState([]);
    const [departments, setDepartments] = useState([]);
    const [submitting,  setSubmitting]  = useState(false);
    const [error,       setError]       = useState("");
    const [files,       setFiles]       = useState([]);   // { file, id, kind, thumbUrl, error }
    const [dragOver,    setDragOver]    = useState(false);
    const [preview,     setPreview]     = useState(null); // { file, kind }
    const fileInputRef = useRef(null);

    useEffect(() => {
        const calls = [api.get("accounts/departments/?page_size=200")];
        if (!isEmployee) calls.unshift(api.get("accounts/users/?page_size=200"));
        Promise.all(calls).then((results) => {
            if (!isEmployee) {
                setUsers(results[0].data.results ?? []);
                setDepartments(results[1].data.results ?? []);
            } else {
                setDepartments(results[0].data.results ?? []);
            }
        }).catch(() => {});
    }, []);

    const handleChange = (e) => {
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));
        setError("");
    };

    // Revoke all thumb URLs when modal unmounts
    useEffect(() => {
        return () => {
            setFiles(prev => { prev.forEach(e => e.thumbUrl && URL.revokeObjectURL(e.thumbUrl)); return prev; });
        };
    }, []);

    const addFiles = (rawFiles) => {
        // Convert FileList → Array synchronously before any async work,
        // and do all heavy work (createObjectURL, quota calc) outside the
        // state updater so it runs exactly once.
        const fileArray = Array.from(rawFiles);
        if (!fileArray.length) return;

        let used = files.filter(e => !e.error).reduce((s, e) => s + e.file.size, 0);

        const newEntries = fileArray.map((f, i) => {
            const ext      = f.name.split('.').pop().toLowerCase();
            const kind     = getFileKind(f);
            let fileError  = null;
            if (!ALLOWED_EXTS.has(ext)) {
                fileError = `".${ext}" not allowed`;
            } else if (used + f.size > TOTAL_MAX) {
                fileError = "Exceeds 50 MB total limit";
            } else {
                used += f.size;
            }
            const thumbUrl = kind === "image" && !fileError ? URL.createObjectURL(f) : null;
            return { file: f, id: `${f.name}-${f.size}-${Date.now()}-${i}`, kind, thumbUrl, error: fileError };
        });

        setFiles(prev => [...prev, ...newEntries]);
    };

    const removeFile = (id) => {
        setFiles(prev => {
            const entry = prev.find(e => e.id === id);
            if (entry?.thumbUrl) URL.revokeObjectURL(entry.thumbUrl);
            return prev.filter(e => e.id !== id);
        });
    };

    const openPreview = (entry) => {
        if (entry.error) return;
        if (entry.kind === "other") {
            const url = URL.createObjectURL(entry.file);
            const a = document.createElement("a");
            a.href = url;
            a.download = entry.file.name;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } else {
            setPreview(entry);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        addFiles(e.dataTransfer.files);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) { setError("Title is required."); return; }
        const invalidFiles = files.filter(f => f.error);
        if (invalidFiles.length) { setError("Remove invalid files before submitting."); return; }
        setSubmitting(true);
        setError("");
        try {
            const payload = { title: form.title.trim(), priority: form.priority };
            if (form.description.trim()) payload.description = form.description.trim();
            if (form.department)  payload.department  = Number(form.department);
            if (form.assigned_to) payload.assigned_to = Number(form.assigned_to);
            const res = await api.post("tickets/", payload);
            const ticketId = res.data.id;

            if (files.length) {
                await Promise.all(files.map(({ file }) => {
                    const fd = new FormData();
                    fd.append("file", file);
                    return api.post(`tickets/${ticketId}/attachments/`, fd, {
                        headers: { "Content-Type": "multipart/form-data" },
                    });
                }));
            }

            onCreated();
            onClose();
        } catch (err) {
            const data = err.response?.data;
            if (data && typeof data === "object") {
                const msgs = Object.values(data).flat();
                setError(msgs.join(" "));
            } else {
                setError("Something went wrong. Please try again.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
        {preview && (
            <FilePreviewOverlay entry={preview} onClose={() => setPreview(null)} />
        )}
        <div className="ntm-overlay" onClick={onClose}>
            <div className="ntm-card" onClick={e => e.stopPropagation()}>
                <div className="ntm-header">
                    <h2 className="ntm-title">New Ticket</h2>
                    <button className="ntm-close" onClick={onClose}><FiX size={16} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="ntm-body">
                        {error && <p className="ntm-error">{error}</p>}

                        <div>
                            <label className="ntm-label">
                                Title <span className="ntm-required">*</span>
                            </label>
                            <input
                                className="ntm-input"
                                name="title"
                                placeholder="Brief summary of the issue"
                                value={form.title}
                                onChange={handleChange}
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="ntm-label">Description</label>
                            <textarea
                                className="ntm-textarea"
                                name="description"
                                placeholder="Detailed description of the issue (optional)"
                                value={form.description}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="ntm-row-2">
                            <div>
                                <label className="ntm-label">Priority</label>
                                <select
                                    className="ntm-select"
                                    name="priority"
                                    value={form.priority}
                                    onChange={handleChange}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>

                            <div>
                                <label className="ntm-label">Department</label>
                                <select
                                    className="ntm-select"
                                    name="department"
                                    value={form.department}
                                    onChange={handleChange}
                                >
                                    <option value="">No Department</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {!isEmployee && (
                            <div>
                                <label className="ntm-label">Assign To</label>
                                <select
                                    className="ntm-select"
                                    name="assigned_to"
                                    value={form.assigned_to}
                                    onChange={handleChange}
                                >
                                    <option value="">— Unassigned —</option>
                                    {users.filter(u => u.role === "agent").map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.name || u.username}
                                            {u.emp_id ? ` (${u.emp_id})` : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* ── Attachments ── */}
                        <div>
                            <label className="ntm-label">Attachments</label>
                            <div
                                className={`ntm-dropzone${dragOver ? " ntm-dropzone-active" : ""}`}
                                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <span className="ntm-drop-icon">📎</span>
                                <span className="ntm-drop-text">
                                    Drop files here or <span className="ntm-drop-link">browse</span>
                                </span>
                                <span className="ntm-drop-hint">PDF, images, video, docs, zip · 50 MB total</span>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    style={{ display: "none" }}
                                    onChange={e => { addFiles(e.target.files); e.target.value = ""; }}
                                />
                            </div>

                            {files.length > 0 && (
                                <ul className="ntm-file-list">
                                    {files.map((entry) => {
                                        const { file, id, kind, thumbUrl, error: fileErr } = entry;
                                        return (
                                            <li key={id} className={`ntm-file-item${fileErr ? " ntm-file-item-error" : ""}`}>
                                                {/* Thumbnail or kind icon */}
                                                <div className="ntm-file-thumb-wrap">
                                                    {thumbUrl
                                                        ? <img src={thumbUrl} alt="" className="ntm-file-thumb" />
                                                        : <span className="ntm-file-kind-icon">
                                                            {kind === "pdf"   ? "📕" :
                                                             kind === "video" ? "🎬" :
                                                             kind === "text"  ? "📝" : "📦"}
                                                          </span>
                                                    }
                                                </div>

                                                {/* Name + meta */}
                                                <div className="ntm-file-info">
                                                    <span className="ntm-file-name">{file.name}</span>
                                                    <span className="ntm-file-meta">
                                                        {fileErr
                                                            ? <span className="ntm-file-err">{fileErr}</span>
                                                            : formatBytes(file.size)
                                                        }
                                                    </span>
                                                </div>

                                                {/* Action buttons — always visible */}
                                                <div className="ntm-file-actions">
                                                    {!fileErr && (
                                                        <button
                                                            type="button"
                                                            className="ntm-fab ntm-fab-preview"
                                                            onClick={() => openPreview(entry)}
                                                            title={kind === "other" ? "Download" : "Preview"}
                                                        >
                                                            {kind === "other"
                                                                ? <><FiDownload size={12} /> Download</>
                                                                : <><FiEye size={12} /> Preview</>
                                                            }
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        className="ntm-fab ntm-fab-delete"
                                                        onClick={() => removeFile(id)}
                                                        title="Remove file"
                                                    >
                                                        <FiX size={12} /> Delete
                                                    </button>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}

                            {/* ── Total size quota bar ── */}
                            {files.length > 0 && (() => {
                                const used    = files.filter(e => !e.error).reduce((s, e) => s + e.file.size, 0);
                                const pct     = Math.min(100, (used / TOTAL_MAX) * 100);
                                const over    = used > TOTAL_MAX;
                                const barColor = pct >= 100 ? "#dc2626" : pct >= 80 ? "#d97706" : "#2563eb";
                                return (
                                    <div className="ntm-quota-wrap">
                                        <div className="ntm-quota-row">
                                            <span className="ntm-quota-label">Total size</span>
                                            <span className="ntm-quota-val" style={{ color: barColor }}>
                                                {formatBytes(used)} / 50 MB
                                                {over && " — over limit"}
                                            </span>
                                        </div>
                                        <div className="ntm-quota-track">
                                            <div
                                                className="ntm-quota-fill"
                                                style={{ width: `${pct}%`, background: barColor }}
                                            />
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    <div className="ntm-footer">
                        <button type="button" className="ntm-btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="ntm-btn-submit" disabled={submitting}>
                            <FiPlus size={14} />
                            {submitting ? "Creating…" : "Create Ticket"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
        </>
    );
}

// ─── Tickets Page ─────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

function Tickets() {
    const navigate = useNavigate();
    const [view,          setView]         = useState("table");
    const [activeFilter,  setActiveFilter] = useState("");
    const [search,        setSearch]       = useState("");
    const [showModal,     setShowModal]    = useState(false);

    const [stats,         setStats]        = useState(null);
    const [tickets,       setTickets]      = useState([]);
    const [totalCount,    setTotalCount]   = useState(0);
    const [page,          setPage]         = useState(1);
    const [priorityDist,  setPriorityDist] = useState([]);
    const [kanbanTickets, setKanbanTickets]= useState([]);

    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    const loadTickets = async (pg = 1, statusVal = activeFilter, q = search) => {
        try {
            const params = new URLSearchParams({ page: pg, page_size: PAGE_SIZE });
            if (statusVal) params.set('status', statusVal);
            if (q)         params.set('search', q);
            const res = await api.get(`tickets/?${params}`);
            setTickets(res.data.results);
            setTotalCount(res.data.count);
        } catch (err) {
            console.error("Tickets load error:", err);
        }
    };

    const loadKanban = async () => {
        try {
            const res = await api.get("tickets/?page_size=100");
            setKanbanTickets(res.data.results);
        } catch (err) {
            console.error("Kanban load error:", err);
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                const [statsRes, distRes] = await Promise.all([
                    api.get("tickets/stats/"),
                    api.get("tickets/priority-distribution/"),
                ]);
                setStats(statsRes.data);
                setPriorityDist(distRes.data);
            } catch (err) {
                console.error("Tickets init error:", err);
            }
            await loadTickets(1, "", "");
        };
        init();
    }, []);

    useEffect(() => {
        if (view === "kanban") loadKanban();
    }, [view]);

    const handleFilter = (key) => {
        setActiveFilter(key);
        setPage(1);
        loadTickets(1, key, search);
    };

    const handleSearch = (e) => {
        const q = e.target.value;
        setSearch(q);
        setPage(1);
        loadTickets(1, activeFilter, q);
    };

    const handlePage = (pg) => {
        if (pg < 1 || pg > totalPages) return;
        setPage(pg);
        loadTickets(pg, activeFilter, search);
    };

    const refreshAll = async () => {
        try {
            const [statsRes, distRes] = await Promise.all([
                api.get("tickets/stats/"),
                api.get("tickets/priority-distribution/"),
            ]);
            setStats(statsRes.data);
            setPriorityDist(distRes.data);
        } catch (err) {
            console.error("Refresh stats error:", err);
        }
        await loadTickets(1, activeFilter, search);
        setPage(1);
        if (view === "kanban") loadKanban();
    };

    const start = (page - 1) * PAGE_SIZE + 1;
    const end   = Math.min(page * PAGE_SIZE, totalCount);

    return (
        <div className="tl-page">

            {showModal && (
                <NewTicketModal
                    onClose={() => setShowModal(false)}
                    onCreated={refreshAll}
                />
            )}

            {/* ── Header ── */}
            <div className="tl-header">
                <div>
                    <h1 className="tl-title">Tickets</h1>
                    <p className="tl-subtitle">Manage and track all support tickets</p>
                </div>
                <div className="tl-header-btns">
                    <button className="tl-btn-outline"><FiFilter size={14} /> Filter</button>
                    <button className="tl-btn-outline"><FiDownload size={14} /> Export</button>
                    <button className="tl-btn-primary" onClick={() => setShowModal(true)}>
                        <FiPlus size={14} /> New Ticket
                    </button>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="tl-stats">
                <div className="tl-stat-card">
                    <div className="tl-stat-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
                        <FiTag size={20} />
                    </div>
                    <div>
                        <p className="tl-stat-label">TOTAL TICKETS</p>
                        <p className="tl-stat-value">{stats?.total ?? "—"}</p>
                    </div>
                </div>
                <div className="tl-stat-card">
                    <div className="tl-stat-icon" style={{ background: "#fff7ed", color: "#ea580c" }}>
                        <FiAlertCircle size={20} />
                    </div>
                    <div>
                        <p className="tl-stat-label">OPEN</p>
                        <p className="tl-stat-value">{stats?.open ?? "—"}</p>
                    </div>
                </div>
                <div className="tl-stat-card">
                    <div className="tl-stat-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                        <FiClock size={20} />
                    </div>
                    <div>
                        <p className="tl-stat-label">IN PROGRESS</p>
                        <p className="tl-stat-value">{stats?.in_progress ?? "—"}</p>
                    </div>
                </div>
                <div className="tl-stat-card">
                    <div className="tl-stat-icon" style={{ background: "#f3f4f6", color: "#6b7280" }}>
                        <FiCheckCircle size={20} />
                    </div>
                    <div>
                        <p className="tl-stat-label">RESOLVED</p>
                        <p className="tl-stat-value">{stats?.resolved ?? "—"}</p>
                    </div>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="tl-body">

                {/* ── Main ── */}
                <div className="tl-main">
                    <div className="tl-card">

                        {/* Toolbar */}
                        <div className="tl-table-top">
                            <div className="tl-pills">
                                {statusFilters.map(f => (
                                    <button
                                        key={f.key}
                                        className={`tl-pill ${activeFilter === f.key ? "tl-pill-active" : ""}`}
                                        onClick={() => handleFilter(f.key)}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>

                            <div className="tl-toolbar-right">
                                <div className="tl-search-wrap">
                                    <FiSearch size={14} className="tl-search-icon" />
                                    <input
                                        className="tl-search"
                                        placeholder="Search tickets..."
                                        value={search}
                                        onChange={handleSearch}
                                    />
                                </div>
                                <div className="tl-view-toggle">
                                    <button
                                        className={`tl-view-btn ${view === "table" ? "tl-view-btn-active" : ""}`}
                                        onClick={() => setView("table")}
                                        title="Table view"
                                    >
                                        <FiList size={20} />
                                    </button>
                                    <button
                                        className={`tl-view-btn ${view === "kanban" ? "tl-view-btn-active" : ""}`}
                                        onClick={() => setView("kanban")}
                                        title="Kanban view"
                                    >
                                        <FiColumns size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ── TABLE VIEW ── */}
                        {view === "table" && (
                            <>
                                <div className="tl-table-scroll">
                                    <table className="tl-table">
                                        <thead>
                                            <tr>
                                                <th>TICKET ID</th>
                                                <th>SUBJECT</th>
                                                <th>REQUESTER</th>
                                                <th>PRIORITY</th>
                                                <th>STATUS</th>
                                                <th>ASSIGNED TO</th>
                                                <th>DATE</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tickets.length === 0 ? (
                                                <tr>
                                                    <td colSpan={8} style={{ textAlign: "center", color: "#94a3b8", padding: "2rem" }}>
                                                        No tickets found
                                                    </td>
                                                </tr>
                                            ) : tickets.map((tk) => {
                                                const p = priorityConfig[tk.priority] ?? priorityConfig.medium;
                                                const s = statusConfig[tk.status]    ?? statusConfig.open;
                                                return (
                                                    <tr
                                                        key={tk.id}
                                                        className="tl-row-clickable"
                                                        onClick={() => navigate(`/tickets/${tk.id}`)}
                                                    >
                                                        <td className="tl-col-id">{tk.ticket_number}</td>
                                                        <td className="tl-col-subject">{tk.title}</td>
                                                        <td className="tl-col-text">{tk.created_by_name ?? "—"}</td>
                                                        <td>
                                                            <span className="tl-priority-badge" style={{ background: p.bg, color: p.color }}>
                                                                <span className="tl-priority-dot" style={{ background: p.dot }} />
                                                                {p.label}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="tl-status-badge" style={{ background: s.bg, color: s.color }}>
                                                                {s.label}
                                                            </span>
                                                        </td>
                                                        <td className="tl-col-text">{tk.assigned_to_name ?? "Unassigned"}</td>
                                                        <td className="tl-col-date">{fmtDate(tk.created_at)}</td>
                                                        <td>
                                                            <button className="tl-more-btn" onClick={(e) => e.stopPropagation()}>
                                                                <FiMoreVertical size={15} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="tl-pagination">
                                    <p className="tl-pag-info">
                                        {totalCount === 0
                                            ? "No tickets"
                                            : `Showing ${start}–${end} of ${totalCount} tickets`}
                                    </p>
                                    <div className="tl-pag-controls">
                                        <button className="tl-pag-btn" onClick={() => handlePage(page - 1)} disabled={page === 1}>
                                            <FiArrowLeft size={13} />
                                        </button>
                                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(pg => (
                                            <button
                                                key={pg}
                                                className={`tl-pag-btn${page === pg ? " tl-pag-active" : ""}`}
                                                onClick={() => handlePage(pg)}
                                            >
                                                {pg}
                                            </button>
                                        ))}
                                        <button className="tl-pag-btn" onClick={() => handlePage(page + 1)} disabled={page === totalPages}>
                                            <FiArrowRight size={13} />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ── KANBAN VIEW ── */}
                        {view === "kanban" && (
                            <div className="kb-board">
                                {kanbanColumns.map(col => {
                                    const colTickets = kanbanTickets.filter(t => t.status === col.key);
                                    const colCount   = stats?.[col.key === "in_progress" ? "in_progress" : col.key] ?? colTickets.length;
                                    return (
                                        <div key={col.key} className="kb-column">
                                            <div className="kb-col-header" style={{ borderTopColor: col.color }}>
                                                <div className="kb-col-title">
                                                    <span className="kb-col-dot" style={{ background: col.color }} />
                                                    <span className="kb-col-label">{col.label}</span>
                                                </div>
                                                <span className="kb-col-count" style={{ background: col.headerBg, color: col.color }}>
                                                    {colCount}
                                                </span>
                                            </div>
                                            <div className="kb-col-body">
                                                {colTickets.length === 0 ? (
                                                    <p style={{ color: "#94a3b8", fontSize: "0.8rem", textAlign: "center", padding: "1rem 0" }}>
                                                        No tickets
                                                    </p>
                                                ) : colTickets.map(tk => (
                                                    <KanbanCard
                                                        key={tk.id}
                                                        ticket={tk}
                                                        onClick={() => navigate(`/tickets/${tk.id}`)}
                                                    />
                                                ))}
                                                <button className="kb-add-btn">
                                                    <FiPlus size={13} /> Add Ticket
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                    </div>
                </div>

                {/* ── Sidebar ── */}
                <aside className="tl-sidebar">

                    {/* Quick Actions */}
                    <div className="tl-card">
                        <p className="tl-sidebar-title">QUICK ACTIONS</p>
                        <div className="tl-qa-grid">
                            {quickActionDefs.map((qa) => (
                                <button
                                    key={qa.key}
                                    className="tl-qa-tile"
                                    onClick={qa.key === "new" ? () => setShowModal(true) : undefined}
                                >
                                    <span className="tl-qa-icon">{qa.icon}</span>
                                    {qa.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Priority Distribution */}
                    <div className="tl-card">
                        <div className="tl-sidebar-title-row">
                            <p className="tl-sidebar-title">PRIORITY DISTRIBUTION</p>
                            <FiBarChart2 size={15} className="tl-sidebar-icon" />
                        </div>
                        <div className="tl-dist-list">
                            {priorityDist.length === 0 ? (
                                <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>No data yet</p>
                            ) : priorityDist.map((d, i) => (
                                <div key={i} className="tl-dist-item">
                                    <div className="tl-dist-row">
                                        <span className="tl-dist-label">{d.label}</span>
                                        <span className="tl-dist-count">{d.count}</span>
                                    </div>
                                    <div className="tl-dist-track">
                                        <div className="tl-dist-fill" style={{ width: `${d.pct}%`, background: d.color }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SLA Status (static — no backend data yet) */}
                    <div className="tl-card">
                        <div className="tl-sidebar-title-row">
                            <p className="tl-sidebar-title">SLA STATUS</p>
                            <FiUsers size={15} className="tl-sidebar-icon" />
                        </div>
                        <div className="tl-sla-list">
                            {slaItems.map((s, i) => (
                                <div key={i} className="tl-sla-item">
                                    <div className="tl-sla-dot" style={{ background: s.color }} />
                                    <span className="tl-sla-label">{s.label}</span>
                                    <span className="tl-sla-count" style={{ color: s.color }}>{s.count}</span>
                                </div>
                            ))}
                        </div>
                        <div className="tl-sla-bar">
                            <div className="tl-sla-seg" style={{ width: "82%", background: "#16a34a" }} />
                            <div className="tl-sla-seg" style={{ width: "11%", background: "#d97706" }} />
                            <div className="tl-sla-seg" style={{ width: "7%",  background: "#dc2626" }} />
                        </div>
                        <p className="tl-sla-note">82% tickets within SLA target</p>
                    </div>

                </aside>

            </div>

        </div>
    );
}

export default Tickets;
