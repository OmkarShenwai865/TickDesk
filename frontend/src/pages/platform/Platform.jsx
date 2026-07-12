import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiBriefcase, FiShield, FiUsers, FiPause, FiPlay, FiKey } from "react-icons/fi";
import StatTile from "../../components/ui/StatTile";
import api from "../../services/api";
import "../settings/Settings.css";

// Local confirm modal — same visual tokens as the existing Invite/New-User modals
// (rgba(15,23,42,.45) overlay, white 16px-radius card) without importing Users.css.
function ConfirmModal({ title, body, confirmLabel, danger, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16,
    }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(15,23,42,0.18)", padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>{title}</h3>
        <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 20px", lineHeight: 1.5 }}>{body}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="st-btn-secondary" onClick={onCancel}>Cancel</button>
          <button
            className="st-btn-primary"
            style={danger ? { background: "#dc2626" } : undefined}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Platform() {
  const [companies, setCompanies] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'suspend'|'activate'|'reset', company }
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get("platform/companies/"),
      api.get("platform/dashboard/"),
    ])
      .then(([companiesRes, dashboardRes]) => {
        setCompanies(companiesRes.data);
        setSummary(dashboardRes.data.summary);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalUsers = companies.reduce((sum, c) => sum + c.users, 0);
  const stats = [
    { Icon: FiBriefcase, label: "TOTAL COMPANIES", value: companies.length, delta: summary?.companiesDelta || "", up: true, color: "#2563eb", trend: summary?.companiesTrend },
    { Icon: FiShield,    label: "TOTAL ADMINS",    value: companies.length, delta: "1 per company",             up: true, color: "#7c3aed", trend: summary?.companiesTrend },
    { Icon: FiUsers,     label: "TOTAL USERS",     value: totalUsers,       delta: summary?.usersDelta || "",     up: true, color: "#16a34a", trend: summary?.usersTrend },
  ];

  const byTickets = [...companies].sort((a, b) => b.tickets - a.tickets);
  const maxTickets = Math.max(...byTickets.map((c) => c.tickets), 1);

  const runConfirmedAction = async () => {
    const { type, company } = confirmAction;
    setBusy(true);
    try {
      if (type === "suspend" || type === "activate") {
        const r = await api.patch(`platform/companies/${company.id}/`, { active: type === "activate" });
        setCompanies((cs) => cs.map((c) => c.id === company.id ? { ...c, active: r.data.active } : c));
        setToast(`${company.name} ${type === "activate" ? "reactivated" : "suspended"}.`);
      } else if (type === "reset") {
        const r = await api.post(`platform/companies/${company.id}/reset-password/`);
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

  return (
    <div className="st-page" style={{ gridTemplateColumns: "1fr" }}>
      <div className="st-main">
        <div>
          <h1 className="st-page-title">Companies</h1>
          <p className="st-page-sub">Every organisation registered on TickDesk, and the admin who owns it.</p>
        </div>

        {toast && (
          <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", color: "#16a34a", fontSize: 13, fontWeight: 600, padding: "10px 16px", borderRadius: 10 }}>
            {toast}
          </div>
        )}

        {/* Stat row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {stats.map((tile) => <StatTile key={tile.label} {...tile} />)}
        </div>

        {/* Companies table */}
        <div className="st-card">
          <div className="st-card-header">
            <h2 className="st-card-title">Registered Companies</h2>
          </div>
          <div className="st-table-wrap">
            <table className="st-table">
              <thead>
                <tr>
                  <th>COMPANY</th>
                  <th>ADMIN</th>
                  <th>USERS</th>
                  <th>TICKETS</th>
                  <th>REGISTERED</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/platform/companies/${c.id}`} style={{ fontWeight: 600, color: "#2563eb", textDecoration: "none" }}>
                        {c.name}
                      </Link>
                    </td>
                    <td>
                      <div style={{ color: "#374151" }}>{c.admin}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>{c.email}</div>
                    </td>
                    <td style={{ color: "#6b7280" }}>{c.users}</td>
                    <td style={{ color: "#6b7280" }}>{c.tickets}</td>
                    <td style={{ color: "#6b7280" }}>{c.registered}</td>
                    <td>
                      <span className={`st-badge ${c.active ? "st-badge-green" : "st-badge-red"}`}>
                        {c.active ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="st-icon-btn"
                          title={c.active ? "Suspend company" : "Reactivate company"}
                          onClick={() => setConfirmAction({ type: c.active ? "suspend" : "activate", company: c })}
                        >
                          {c.active ? <FiPause size={14} /> : <FiPlay size={14} />}
                        </button>
                        <button
                          className="st-icon-btn"
                          title="Reset admin password"
                          onClick={() => setConfirmAction({ type: "reset", company: c })}
                        >
                          <FiKey size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && companies.length === 0 && (
                  <tr><td colSpan={7} style={{ color: "#9ca3af", textAlign: "center", padding: 24 }}>No companies registered yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tickets by company */}
        <div className="st-card">
          <div className="st-card-header">
            <h2 className="st-card-title">Tickets by Company</h2>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>Total tickets raised, all time</span>
          </div>
          <div className="st-card-body">
            {loading ? (
              <p style={{ fontSize: 13, color: "#9ca3af" }}>Loading…</p>
            ) : byTickets.length === 0 ? (
              <p style={{ fontSize: 13, color: "#9ca3af" }}>No companies registered yet.</p>
            ) : byTickets.map((c) => (
              <div key={c.id} style={{ marginBottom: 14 }} title={`${c.name}: ${c.tickets} tickets`}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: "#374151" }}>{c.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{c.tickets}</span>
                </div>
                <div className="st-bar-bg">
                  <div className="st-bar" style={{ width: `${(c.tickets / maxTickets) * 100}%`, background: "#2563eb" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {confirmAction?.type === "suspend" && (
        <ConfirmModal
          title={`Suspend ${confirmAction.company.name}?`}
          body="Every user in this company will be immediately blocked from logging in. You can reactivate them at any time."
          confirmLabel={busy ? "Suspending…" : "Suspend"}
          danger
          onConfirm={runConfirmedAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction?.type === "activate" && (
        <ConfirmModal
          title={`Reactivate ${confirmAction.company.name}?`}
          body="Users at this company will be able to log in again."
          confirmLabel={busy ? "Reactivating…" : "Reactivate"}
          onConfirm={runConfirmedAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction?.type === "reset" && (
        <ConfirmModal
          title={`Reset password for ${confirmAction.company.admin}?`}
          body={`A new temporary password will be emailed to ${confirmAction.company.email}. Their current password stops working immediately.`}
          confirmLabel={busy ? "Sending…" : "Send Reset Email"}
          danger
          onConfirm={runConfirmedAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
