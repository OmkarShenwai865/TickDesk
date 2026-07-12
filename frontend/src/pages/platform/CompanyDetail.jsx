import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FiUsers, FiHeadphones, FiClipboard, FiBox, FiPause, FiPlay, FiKey, FiEdit2, FiX, FiArrowLeft,
} from "react-icons/fi";
import api from "../../services/api";
import "../settings/Settings.css";

// Same status colors already used on the company-admin Dashboard (Dashboard.jsx
// TICKET_STATUS_COLORS), reused here for consistency across the app.
const STATUS_COLORS = { Open: "#3b82f6", "In Progress": "#f97316", Resolved: "#22c55e", Closed: "#6b7280" };

function StatTile({ Icon, label, value, delta, up, color }) {
  return (
    <div className="st-card">
      <div className="st-card-body">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9, background: `${color}1a`, color,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Icon size={16} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: up ? "#16a34a" : "#dc2626" }}>{delta}</span>
        </div>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", color: "#9ca3af", margin: "0 0 2px" }}>{label}</p>
        <p style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>{value}</p>
      </div>
    </div>
  );
}

function AreaChart({ points }) {
  const w = 600, h = 140, pad = 4;
  const max = Math.max(...points, 1);
  const step = (w - pad * 2) / (points.length - 1);
  const coords = points.map((p, i) => [pad + i * step, h - pad - (p / max) * (h - pad * 2)]);
  const line = coords.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `${pad},${h - pad} ${line} ${w - pad},${h - pad}`;
  const last = coords[coords.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 140, display: "block" }}>
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#f1f5f9" strokeWidth="1" />
      <polygon points={area} fill="#2563eb" opacity="0.08" />
      <polyline points={line} fill="none" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="4" fill="#fff" stroke="#2563eb" strokeWidth="2" />
      <text x={last[0] - 6} y={last[1] - 10} textAnchor="end" fontSize="11" fontWeight="700" fill="#111827">
        {points[points.length - 1]}
      </text>
    </svg>
  );
}

// scaleTotal is the denominator the arc fractions are drawn against — defaults to
// the sum of segments (a part-to-whole donut), but a single-segment "rate against
// a fixed 100" ring must pass scaleTotal={100} explicitly, or its one segment
// would always render as a full circle (value / itself = 1).
function Donut({ segments, scaleTotal, centerValue, centerLabel, size = 140 }) {
  const cx = 60, cy = 60, r = 46, sw = 14;
  const C = 2 * Math.PI * r;
  const total = scaleTotal ?? (segments.reduce((s, seg) => s + seg.value, 0) || 1);
  let cumulative = 0;
  return (
    <svg viewBox="0 0 120 120" style={{ width: size, height: size }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={sw} />
      {segments.map((seg, i) => {
        const len = (seg.value / total) * C || 0;
        const offset = -cumulative;
        cumulative += len;
        return (
          <circle
            key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth={sw}
            strokeDasharray={`${len} ${C - len}`} strokeDashoffset={offset}
            style={{ transform: "rotate(-90deg)", transformOrigin: `${cx}px ${cy}px` }}
          />
        );
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="20" fontWeight="700" fill="#111827">{centerValue}</text>
      {centerLabel && <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="#9ca3af">{centerLabel}</text>}
    </svg>
  );
}

function ConfirmModal({ title, body, confirmLabel, danger, onConfirm, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(15,23,42,0.18)", padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>{title}</h3>
        <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 20px", lineHeight: 1.5 }}>{body}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="st-btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="st-btn-primary" style={danger ? { background: "#dc2626" } : undefined} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function initials(name) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function DrawerSection({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", color: "#9ca3af", margin: "0 0 8px" }}>{title}</p>
      {children}
    </div>
  );
}

function DrawerRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f3f4f6", fontSize: 13 }}>
      <span style={{ color: "#6b7280" }}>{label}</span>
      <span style={{ fontWeight: 600, color: "#111827" }}>{value ?? "—"}</span>
    </div>
  );
}

function UserDrawerBody({ user, company }) {
  const ticketsRaised = company.tickets.filter((t) => t.requester === user.name).length;
  const ticketsAssigned = company.tickets.filter((t) => t.assignedTo === user.name).length;
  const assetsAssigned = company.assets.filter((a) => a.assignedTo === user.name).length;
  return (
    <>
      <div style={{ textAlign: "center", padding: "24px 20px 16px" }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%", background: "#eff6ff", color: "#2563eb",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, margin: "0 auto 12px",
        }}>
          {initials(user.name)}
        </div>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: "0 0 2px" }}>{user.name}</p>
        <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 10px" }}>{user.email}</p>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
          <span className="st-badge st-badge-blue">{user.role}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: user.status_color || "#9ca3af" }}>
            ● {user.status}
          </span>
        </div>
      </div>
      <div style={{ padding: "0 20px 20px" }}>
        <DrawerSection title="GENERAL INFORMATION">
          <DrawerRow label="Department" value={user.department} />
        </DrawerSection>
        <DrawerSection title="ACTIVITY SUMMARY">
          <DrawerRow label="Tickets Raised" value={ticketsRaised} />
          <DrawerRow label="Tickets Assigned" value={ticketsAssigned} />
          <DrawerRow label="Assets Assigned" value={assetsAssigned} />
        </DrawerSection>
      </div>
    </>
  );
}

function DepartmentDrawerBody({ dept, company }) {
  const deptUsers = company.users.filter((u) => u.department === dept.name);
  const openTickets = company.tickets.filter((t) => t.department === dept.name && t.status !== "Resolved" && t.status !== "Closed").length;
  return (
    <div style={{ padding: 20 }}>
      <p style={{ fontSize: 17, fontWeight: 700, color: "#111827", margin: "0 0 16px" }}>{dept.name}</p>
      <DrawerSection title="OVERVIEW">
        <DrawerRow label="Users" value={dept.users} />
        <DrawerRow label="Assets" value={dept.assets} />
        <DrawerRow label="Open Tickets" value={openTickets} />
      </DrawerSection>
      <DrawerSection title={`USERS (${deptUsers.length})`}>
        {deptUsers.length === 0 ? (
          <p style={{ fontSize: 13, color: "#9ca3af" }}>No users listed in this department.</p>
        ) : (
          deptUsers.map((u) => (
            <div key={u.email} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f3f4f6", fontSize: 13 }}>
              <span style={{ color: "#374151" }}>{u.name}</span>
              <span style={{ color: "#9ca3af" }}>{u.role}</span>
            </div>
          ))
        )}
      </DrawerSection>
    </div>
  );
}

function AssetDrawerBody({ asset }) {
  return (
    <div style={{ padding: 20 }}>
      <p style={{ fontSize: 17, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>{asset.name}</p>
      <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 16px" }}>{asset.category}</p>
      <DrawerSection title="DETAILS">
        <DrawerRow label="Assigned To" value={asset.assignedTo} />
        <DrawerRow label="Department" value={asset.department} />
        <DrawerRow label="Status" value={asset.status} />
        <DrawerRow label="Purchase Date" value={asset.purchaseDate} />
      </DrawerSection>
    </div>
  );
}

function TicketDrawerBody({ ticket }) {
  return (
    <div style={{ padding: 20 }}>
      <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 2px" }}>{ticket.id}</p>
      <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 16px" }}>{ticket.title}</p>
      <DrawerSection title="DETAILS">
        <DrawerRow label="Status" value={ticket.status} />
        <DrawerRow label="Priority" value={ticket.priority} />
        <DrawerRow label="Department" value={ticket.department} />
        <DrawerRow label="Requester" value={ticket.requester} />
        <DrawerRow label="Assigned To" value={ticket.assignedTo} />
        <DrawerRow label="Created" value={ticket.created} />
      </DrawerSection>
    </div>
  );
}

const DRAWER_TITLES = { user: "User Details", department: "Department Details", asset: "Asset Details", ticket: "Ticket Details" };

function RecordDrawer({ record, company, onClose }) {
  const isOpen = !!record;
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 1000,
          opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? "auto" : "none", transition: "opacity 0.25s ease",
        }}
      />
      <div style={{
        position: "fixed", top: 0, right: 0, width: 380, maxWidth: "100%", height: "100vh",
        background: "#fff", boxShadow: "-6px 0 32px rgba(15,23,42,0.14)", zIndex: 1001,
        display: "flex", flexDirection: "column", overflowY: "auto",
        transform: isOpen ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
      }}>
        {record && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{DRAWER_TITLES[record.type]}</span>
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}>
                <FiX size={18} />
              </button>
            </div>
            {record.type === "user" && <UserDrawerBody user={record.data} company={company} />}
            {record.type === "department" && <DepartmentDrawerBody dept={record.data} company={company} />}
            {record.type === "asset" && <AssetDrawerBody asset={record.data} />}
            {record.type === "ticket" && <TicketDrawerBody ticket={record.data} />}
          </>
        )}
      </div>
    </>
  );
}

const TABS = ["Users", "Departments", "Assets", "Tickets"];

export default function CompanyDetail() {
  const { id } = useParams();

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState("Users");
  const [confirmAction, setConfirmAction] = useState(null); // 'suspend' | 'activate' | 'reset'
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null); // { type: 'user'|'department'|'asset'|'ticket', data }

  useEffect(() => {
    api.get(`platform/companies/${id}/`)
      .then((r) => setCompany(r.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="st-page" style={{ gridTemplateColumns: "1fr" }}>
        <div className="st-main"><p className="st-page-sub">Loading company…</p></div>
      </div>
    );
  }

  if (notFound || !company) {
    return (
      <div className="st-page" style={{ gridTemplateColumns: "1fr" }}>
        <div className="st-main">
          <p className="st-page-sub">Company not found. <Link to="/platform/companies">Back to Companies</Link></p>
        </div>
      </div>
    );
  }

  const resolutionRate = Math.round(
    (company.ticketStatus.Resolved / (company.ticketStatus.Open + company.ticketStatus["In Progress"] + company.ticketStatus.Resolved + company.ticketStatus.Closed || 1)) * 100
  );

  const statTiles = [
    { Icon: FiUsers,      label: "TOTAL USERS",     value: company.totalUsers,    delta: company.usersDelta,  up: true,               color: "#2563eb" },
    { Icon: FiHeadphones, label: "SUPPORT AGENTS",  value: company.supportAgents, delta: company.agentsDelta, up: true,               color: "#7c3aed" },
    { Icon: FiClipboard,  label: "OPEN TICKETS",    value: company.openTickets,   delta: company.ticketDelta, up: company.ticketUp,  color: "#ea580c" },
    { Icon: FiBox,        label: "TOTAL ASSETS",    value: company.totalAssets,   delta: company.assetsDelta, up: true,               color: "#16a34a" },
  ];

  const runConfirmedAction = async () => {
    setBusy(true);
    try {
      if (confirmAction === "suspend" || confirmAction === "activate") {
        const r = await api.patch(`platform/companies/${id}/`, { active: confirmAction === "activate" });
        setCompany((c) => ({ ...c, active: r.data.active }));
        setToast(`${company.name} ${confirmAction === "activate" ? "reactivated" : "suspended"}.`);
      } else if (confirmAction === "reset") {
        const r = await api.post(`platform/companies/${id}/reset-password/`);
        setToast(r.data.detail);
      }
    } catch {
      setToast("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
      setConfirmAction(null);
      setTimeout(() => setToast(null), 3500);
    }
  };

  const openEdit = () => {
    setEditForm({ name: company.name, supportEmail: company.supportEmail, website: company.website, timezone: company.timezone });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    try {
      const r = await api.patch(`platform/companies/${id}/`, {
        name: editForm.name,
        support_email: editForm.supportEmail,
        website: editForm.website,
        timezone: editForm.timezone,
      });
      setCompany((c) => ({
        ...c,
        name: r.data.name,
        supportEmail: r.data.supportEmail,
        website: r.data.website,
        timezone: r.data.timezone,
      }));
      setEditOpen(false);
      setToast("Company details updated.");
      setTimeout(() => setToast(null), 3500);
    } catch (err) {
      setToast(Object.values(err.response?.data || {}).flat().join(" ") || "Couldn't save changes.");
      setTimeout(() => setToast(null), 3500);
    }
  };

  return (
    <div className="st-page" style={{ gridTemplateColumns: "1fr" }}>
      <div className="st-main">
        <Link
          to="/platform/companies"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#6b7280", textDecoration: "none", width: "fit-content" }}
        >
          <FiArrowLeft size={14} /> Back to Companies
        </Link>

        {toast && (
          <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", color: "#16a34a", fontSize: 13, fontWeight: 600, padding: "10px 16px", borderRadius: 10 }}>
            {toast}
          </div>
        )}

        {/* Header card */}
        <div className="st-card">
          <div className="st-card-body" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap", padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, background: "#eff6ff", color: "#2563eb",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 700, flexShrink: 0,
              }}>
                {company.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <h1 style={{ fontSize: 17, fontWeight: 700, color: "#111827", margin: 0 }}>{company.name}</h1>
                  <span className={`st-badge ${company.active ? "st-badge-green" : "st-badge-red"}`}>
                    {company.active ? "Active" : "Suspended"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 18, flexWrap: "wrap", fontSize: 12, color: "#6b7280" }}>
                  <span>Support: {company.supportEmail || "—"}</span>
                  <span>{company.website || "—"}</span>
                  <span>Timezone: {company.timezone}</span>
                  <span>Registered {company.registered}</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="st-btn-secondary" onClick={openEdit}><FiEdit2 size={13} /> Edit Company</button>
                <button className="st-btn-secondary" onClick={() => setConfirmAction(company.active ? "suspend" : "activate")}>
                  {company.active ? <FiPause size={13} /> : <FiPlay size={13} />} {company.active ? "Suspend" : "Reactivate"}
                </button>
                <button className="st-btn-secondary" onClick={() => setConfirmAction("reset")}><FiKey size={13} /> Reset Password</button>
              </div>
              <div style={{ textAlign: "center" }}>
                <Donut
                  segments={[{ value: resolutionRate, color: "#16a34a" }]}
                  scaleTotal={100}
                  centerValue={`${resolutionRate}%`}
                  size={72}
                />
                <p style={{ fontSize: 10, color: "#9ca3af", margin: "2px 0 0" }}>Resolution rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stat tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {statTiles.map((t) => <StatTile key={t.label} {...t} />)}
        </div>

        {/* Charts */}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 12 }}>
          <div className="st-card">
            <div className="st-card-header">
              <h2 className="st-card-title">Ticket Creation Trend</h2>
              <span style={{ fontSize: 12, color: "#9ca3af" }}>Last 10 weeks</span>
            </div>
            <div className="st-card-body">
              <AreaChart points={company.ticketCreation} />
            </div>
          </div>
          <div className="st-card">
            <div className="st-card-header">
              <h2 className="st-card-title">Ticket Status</h2>
            </div>
            <div className="st-card-body" style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <Donut
                segments={Object.entries(company.ticketStatus).map(([label, value]) => ({ label, value, color: STATUS_COLORS[label] }))}
                centerValue={Object.values(company.ticketStatus).reduce((s, v) => s + v, 0)}
                centerLabel="TOTAL"
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.entries(company.ticketStatus).map(([label, value]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLORS[label] }} />
                    <span style={{ color: "#374151" }}>{label}</span>
                    <span style={{ fontWeight: 700, color: "#111827", marginLeft: "auto" }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs + table */}
        <div className="st-card">
          <div className="st-card-header">
            <div style={{ display: "flex", gap: 4 }}>
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "6px 14px", borderRadius: 20, border: "1.5px solid transparent",
                    background: activeTab === tab ? "#2563eb" : "transparent",
                    color: activeTab === tab ? "#fff" : "#6b7280",
                    fontSize: 13, fontWeight: 500, cursor: "pointer",
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="st-table-wrap">
            {activeTab === "Users" && (
              <table className="st-table">
                <thead><tr><th>NAME</th><th>EMAIL</th><th>ROLE</th><th>STATUS</th></tr></thead>
                <tbody>
                  {company.users.map((u) => (
                    <tr key={u.email} onClick={() => setSelectedRecord({ type: "user", data: u })} style={{ cursor: "pointer" }}>
                      <td style={{ fontWeight: 600, color: "#111827" }}>{u.name}</td>
                      <td style={{ color: "#6b7280" }}>{u.email}</td>
                      <td><span className="st-badge st-badge-blue">{u.role}</span></td>
                      <td style={{ color: u.status_color }}>{u.status}</td>
                    </tr>
                  ))}
                  {company.users.length === 0 && (
                    <tr><td colSpan={4} style={{ color: "#9ca3af", textAlign: "center", padding: 24 }}>No users yet.</td></tr>
                  )}
                </tbody>
              </table>
            )}
            {activeTab === "Departments" && (
              <table className="st-table">
                <thead><tr><th>DEPARTMENT</th><th>USERS</th><th>ASSETS</th></tr></thead>
                <tbody>
                  {company.departments.map((d) => (
                    <tr key={d.name} onClick={() => setSelectedRecord({ type: "department", data: d })} style={{ cursor: "pointer" }}>
                      <td style={{ fontWeight: 600, color: "#111827" }}>{d.name}</td>
                      <td style={{ color: "#6b7280" }}>{d.users}</td>
                      <td style={{ color: "#6b7280" }}>{d.assets}</td>
                    </tr>
                  ))}
                  {company.departments.length === 0 && (
                    <tr><td colSpan={3} style={{ color: "#9ca3af", textAlign: "center", padding: 24 }}>No departments yet.</td></tr>
                  )}
                </tbody>
              </table>
            )}
            {activeTab === "Assets" && (
              <table className="st-table">
                <thead><tr><th>ASSET</th><th>CATEGORY</th><th>ASSIGNED TO</th></tr></thead>
                <tbody>
                  {company.assets.map((a, i) => (
                    <tr key={i} onClick={() => setSelectedRecord({ type: "asset", data: a })} style={{ cursor: "pointer" }}>
                      <td style={{ fontWeight: 600, color: "#111827" }}>{a.name}</td>
                      <td style={{ color: "#6b7280" }}>{a.category}</td>
                      <td style={{ color: "#6b7280" }}>{a.assignedTo}</td>
                    </tr>
                  ))}
                  {company.assets.length === 0 && (
                    <tr><td colSpan={3} style={{ color: "#9ca3af", textAlign: "center", padding: 24 }}>No assets yet.</td></tr>
                  )}
                </tbody>
              </table>
            )}
            {activeTab === "Tickets" && (
              <table className="st-table">
                <thead><tr><th>TICKET</th><th>TITLE</th><th>STATUS</th><th>PRIORITY</th></tr></thead>
                <tbody>
                  {company.tickets.map((t) => (
                    <tr key={t.id} onClick={() => setSelectedRecord({ type: "ticket", data: t })} style={{ cursor: "pointer" }}>
                      <td style={{ fontWeight: 600, color: "#111827" }}>{t.id}</td>
                      <td style={{ color: "#6b7280" }}>{t.title}</td>
                      <td><span className="st-badge st-badge-blue">{t.status}</span></td>
                      <td style={{ color: "#6b7280" }}>{t.priority}</td>
                    </tr>
                  ))}
                  {company.tickets.length === 0 && (
                    <tr><td colSpan={4} style={{ color: "#9ca3af", textAlign: "center", padding: 24 }}>No tickets yet.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="st-card">
          <div className="st-card-header">
            <h2 className="st-card-title">Recent Activity</h2>
          </div>
          <div className="st-card-body">
            {company.activity.length === 0 ? (
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>No activity recorded yet.</p>
            ) : (
              <ul className="st-timeline">
                {company.activity.map((a, i) => (
                  <li key={i} className="st-timeline-item">
                    <span className="st-timeline-dot" style={{ background: a.dot, borderColor: `${a.dot}33` }} />
                    <div className="st-timeline-text">
                      <p>{a.text}</p>
                      <span>{a.meta}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {confirmAction === "suspend" && (
        <ConfirmModal
          title={`Suspend ${company.name}?`}
          body="Every user in this company will be immediately blocked from logging in. You can reactivate them at any time."
          confirmLabel={busy ? "Suspending…" : "Suspend"} danger
          onConfirm={runConfirmedAction} onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction === "activate" && (
        <ConfirmModal
          title={`Reactivate ${company.name}?`}
          body="Users at this company will be able to log in again."
          confirmLabel={busy ? "Reactivating…" : "Reactivate"}
          onConfirm={runConfirmedAction} onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction === "reset" && (
        <ConfirmModal
          title={`Reset password for ${company.admin}?`}
          body={`A new temporary password will be emailed to ${company.email}. Their current password stops working immediately.`}
          confirmLabel={busy ? "Sending…" : "Send Reset Email"} danger
          onConfirm={runConfirmedAction} onCancel={() => setConfirmAction(null)}
        />
      )}

      {editOpen && editForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 460, boxShadow: "0 20px 60px rgba(15,23,42,0.18)", padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 16px" }}>Edit Company</h3>
            <div className="st-field" style={{ marginBottom: 14 }}>
              <label>Company Name</label>
              <input className="st-input" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="st-field" style={{ marginBottom: 14 }}>
              <label>Support Email</label>
              <input className="st-input" value={editForm.supportEmail} onChange={(e) => setEditForm((f) => ({ ...f, supportEmail: e.target.value }))} />
            </div>
            <div className="st-field" style={{ marginBottom: 14 }}>
              <label>Website</label>
              <input className="st-input" value={editForm.website} onChange={(e) => setEditForm((f) => ({ ...f, website: e.target.value }))} />
            </div>
            <div className="st-field" style={{ marginBottom: 20 }}>
              <label>Timezone</label>
              <input className="st-input" value={editForm.timezone} onChange={(e) => setEditForm((f) => ({ ...f, timezone: e.target.value }))} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="st-btn-secondary" onClick={() => setEditOpen(false)}>Cancel</button>
              <button className="st-btn-primary" onClick={saveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      <RecordDrawer record={selectedRecord} company={company} onClose={() => setSelectedRecord(null)} />
    </div>
  );
}
