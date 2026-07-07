import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./AssetDetail.css";

import {
    FiArrowLeft,
    FiMonitor,
    FiCpu,
    FiPrinter,
    FiServer,
    FiHardDrive,
    FiWifi,
    FiEdit2,
    FiUserPlus,
    FiAlertTriangle,
    FiCheckCircle,
    FiInfo,
    FiCalendar,
    FiTag,
    FiUser,
    FiGrid,
    FiPackage,
    FiActivity,
} from "react-icons/fi";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
    available:   { label: "Available",   cls: "adb-available",   dot: "#16a34a" },
    assigned:    { label: "Assigned",    cls: "adb-assigned",    dot: "#2563eb" },
    maintenance: { label: "Maintenance", cls: "adb-maintenance", dot: "#ea580c" },
    retired:     { label: "Retired",     cls: "adb-retired",     dot: "#9ca3af" },
};

const CAT_ICONS = {
    laptop:     { Icon: FiMonitor,   color: "#2563eb" },
    desktop:    { Icon: FiCpu,       color: "#0891b2" },
    monitor:    { Icon: FiMonitor,   color: "#7c3aed" },
    printer:    { Icon: FiPrinter,   color: "#ea580c" },
    networking: { Icon: FiWifi,      color: "#06b6d4" },
    server:     { Icon: FiServer,    color: "#ef4444" },
    other:      { Icon: FiHardDrive, color: "#6b7280" },
};

function fmtDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function daysAgo(iso) {
    if (!iso) return "—";
    const diff = Math.floor((Date.now() - new Date(iso)) / 86_400_000);
    if (diff === 0) return "Today";
    if (diff === 1) return "1 day ago";
    return `${diff} days ago`;
}

function initials(name) {
    if (!name) return "?";
    return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Asset Detail ─────────────────────────────────────────────────────────────

export default function AssetDetail() {
    const { id }       = useParams();
    const navigate     = useNavigate();
    const [asset,     setAsset]    = useState(null);
    const [notFound,  setNotFound] = useState(false);

    useEffect(() => {
        api.get(`assets/${id}/`)
            .then(r  => setAsset(r.data))
            .catch(e => { if (e.response?.status === 404) setNotFound(true); });
    }, [id]);

    if (notFound) return (
        <div className="adet-page adet-center">
            <p className="adet-empty">Asset not found.</p>
        </div>
    );

    if (!asset) return (
        <div className="adet-page adet-center">
            <p className="adet-empty">Loading…</p>
        </div>
    );

    const sc  = STATUS_CONFIG[asset.status] ?? STATUS_CONFIG.available;
    const cat = CAT_ICONS[asset.category]   ?? { Icon: FiHardDrive, color: "#6b7280" };
    const { Icon: CatIcon, color: catColor } = cat;

    return (
        <div className="adet-page">

            {/* ── Header ── */}
            <div className="adet-header">
                <div className="adet-header-left">
                    <button className="adet-back-btn" onClick={() => navigate("/assets")}>
                        <FiArrowLeft size={15} /> Back to Assets
                    </button>
                    <div className="adet-id-row">
                        <h1 className="adet-asset-tag">{asset.asset_tag}</h1>
                        <span className={`adet-badge ${sc.cls}`}>{sc.label.toUpperCase()}</span>
                        <span className="adet-badge adet-cat-badge" style={{ background: catColor + "18", color: catColor }}>
                            <CatIcon size={11} /> {asset.category_display.toUpperCase()}
                        </span>
                    </div>
                    <p className="adet-subtitle">
                        Added {fmtDate(asset.created_at)}
                        {asset.assigned_to_name && (
                            <> &bull; Assigned to <strong>{asset.assigned_to_name}</strong></>
                        )}
                    </p>
                </div>

                <div className="adet-header-actions">
                    <button className="adet-btn adet-btn-outline">
                        <FiUserPlus size={13} /> Assign
                    </button>
                    <button className="adet-btn adet-btn-outline">
                        <FiEdit2 size={13} /> Edit
                    </button>
                    {asset.status !== "retired" && (
                        <button className="adet-btn adet-btn-danger">
                            <FiAlertTriangle size={13} /> Retire
                        </button>
                    )}
                    {asset.status !== "available" && asset.status !== "retired" && (
                        <button className="adet-btn adet-btn-green">
                            <FiCheckCircle size={13} /> Mark Available
                        </button>
                    )}
                </div>
            </div>

            {/* ── Content ── */}
            <div className="adet-content">

                {/* ── Left Column ── */}
                <div className="adet-left">

                    {/* Asset Information */}
                    <div className="adet-card">
                        <div className="adet-card-heading">
                            <FiInfo size={15} className="adet-heading-icon" />
                            <h2>Asset Information</h2>
                        </div>
                        <hr className="adet-divider" />

                        <div className="adet-field-full">
                            <span className="adet-label">ASSET NAME</span>
                            <p className="adet-asset-name">{asset.asset_name}</p>
                        </div>

                        <div className="adet-field-row">
                            <div className="adet-field">
                                <span className="adet-label">CATEGORY</span>
                                <p className="adet-value adet-cat-val" style={{ color: catColor }}>
                                    <CatIcon size={13} />
                                    {asset.category_display}
                                </p>
                            </div>
                            <div className="adet-field">
                                <span className="adet-label">STATUS</span>
                                <span className={`adet-badge ${sc.cls}`} style={{ fontSize: "12px" }}>
                                    <span className="adet-dot" style={{ background: sc.dot }} />
                                    {sc.label}
                                </span>
                            </div>
                        </div>

                        <div className="adet-field-row">
                            <div className="adet-field">
                                <span className="adet-label">DEPARTMENT</span>
                                <p className="adet-value">{asset.department_name || "—"}</p>
                            </div>
                            <div className="adet-field">
                                <span className="adet-label">PURCHASE DATE</span>
                                <p className="adet-value">
                                    {asset.purchase_date ? fmtDate(asset.purchase_date) : "—"}
                                </p>
                            </div>
                        </div>

                        <div className="adet-field-row">
                            <div className="adet-field">
                                <span className="adet-label">ASSET ID</span>
                                <p className="adet-value adet-mono">{asset.asset_tag}</p>
                            </div>
                            <div className="adet-field">
                                <span className="adet-label">ADDED TO INVENTORY</span>
                                <p className="adet-value">{fmtDate(asset.created_at)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Assignment */}
                    <div className="adet-card">
                        <div className="adet-card-heading">
                            <FiUser size={15} className="adet-heading-icon" />
                            <h2>Assignment</h2>
                        </div>
                        <hr className="adet-divider" />

                        {asset.assigned_to_name ? (
                            <div className="adet-assignee-card">
                                <div className="adet-assignee-avatar">
                                    {initials(asset.assigned_to_name)}
                                </div>
                                <div className="adet-assignee-info">
                                    <p className="adet-assignee-name">{asset.assigned_to_name}</p>
                                    {asset.assigned_to_email && (
                                        <p className="adet-assignee-meta">{asset.assigned_to_email}</p>
                                    )}
                                    {asset.assigned_to_emp_id && (
                                        <p className="adet-assignee-meta adet-mono">{asset.assigned_to_emp_id}</p>
                                    )}
                                </div>
                                <span className="adet-assignee-badge">Currently Assigned</span>
                            </div>
                        ) : (
                            <div className="adet-unassigned">
                                <FiPackage size={32} className="adet-unassigned-icon" />
                                <p className="adet-unassigned-title">Not Assigned</p>
                                <p className="adet-unassigned-sub">This asset is currently available in inventory.</p>
                                <button className="adet-btn adet-btn-outline" style={{ marginTop: "12px" }}>
                                    <FiUserPlus size={13} /> Assign to User
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Activity Log */}
                    <div className="adet-card">
                        <div className="adet-card-heading">
                            <FiActivity size={15} className="adet-heading-icon" />
                            <h2>Activity Log</h2>
                        </div>
                        <hr className="adet-divider" />
                        <div className="adet-log-list">
                            <div className="adet-log-item">
                                <div className="adet-log-icon-col">
                                    <FiCheckCircle size={14} style={{ color: "#16a34a" }} />
                                    <span className="adet-log-line" />
                                </div>
                                <div className="adet-log-body">
                                    <p className="adet-log-text">
                                        Asset <strong>{asset.asset_tag}</strong> added to inventory
                                    </p>
                                    <p className="adet-log-time">{fmtDate(asset.created_at)}</p>
                                </div>
                            </div>
                            {asset.assigned_to_name && (
                                <div className="adet-log-item">
                                    <div className="adet-log-icon-col">
                                        <FiUser size={14} style={{ color: "#2563eb" }} />
                                    </div>
                                    <div className="adet-log-body">
                                        <p className="adet-log-text">
                                            Assigned to <strong>{asset.assigned_to_name}</strong>
                                        </p>
                                        <p className="adet-log-time">{fmtDate(asset.updated_at)}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* ── Right Sidebar ── */}
                <aside className="adet-right">

                    {/* Asset Summary */}
                    <div className="adet-card">
                        <p className="adet-sidebar-label">ASSET SUMMARY</p>

                        <div className="adet-summary-icon-wrap" style={{ background: catColor + "15" }}>
                            <CatIcon size={28} color={catColor} />
                        </div>

                        <div className="adet-summary-list">
                            <div className="adet-summary-row">
                                <span className="adet-summary-key"><FiTag size={13} /> Asset ID</span>
                                <span className="adet-summary-val adet-mono">{asset.asset_tag}</span>
                            </div>
                            <div className="adet-summary-row">
                                <span className="adet-summary-key"><FiGrid size={13} /> Category</span>
                                <span className="adet-summary-val">{asset.category_display}</span>
                            </div>
                            <div className="adet-summary-row">
                                <span className="adet-summary-key"><FiCheckCircle size={13} /> Status</span>
                                <span className={`adet-badge ${sc.cls}`} style={{ fontSize: "11px" }}>{sc.label}</span>
                            </div>
                            <div className="adet-summary-row">
                                <span className="adet-summary-key"><FiCalendar size={13} /> Added</span>
                                <span className="adet-summary-val">{daysAgo(asset.created_at)}</span>
                            </div>
                            {asset.purchase_date && (
                                <div className="adet-summary-row">
                                    <span className="adet-summary-key"><FiCalendar size={13} /> Purchased</span>
                                    <span className="adet-summary-val">{fmtDate(asset.purchase_date)}</span>
                                </div>
                            )}
                            <div className="adet-summary-row">
                                <span className="adet-summary-key"><FiUser size={13} /> Assigned To</span>
                                <span className="adet-summary-val">{asset.assigned_to_name || "Unassigned"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="adet-card">
                        <p className="adet-sidebar-label">QUICK ACTIONS</p>
                        <div className="adet-qa-list">
                            <button className="adet-qa-btn">
                                <FiUserPlus size={15} color="#2563eb" />
                                <span>Assign to User</span>
                            </button>
                            <button className="adet-qa-btn">
                                <FiEdit2 size={15} color="#7c3aed" />
                                <span>Edit Asset Details</span>
                            </button>
                            <button className="adet-qa-btn">
                                <FiAlertTriangle size={15} color="#ea580c" />
                                <span>Report Issue</span>
                            </button>
                            <button className="adet-qa-btn">
                                <FiAlertTriangle size={15} color="#9ca3af" />
                                <span>Mark as Retired</span>
                            </button>
                        </div>
                    </div>

                </aside>

            </div>
        </div>
    );
}
