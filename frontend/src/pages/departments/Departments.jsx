import { useState, useEffect, useRef } from "react";
import api from "../../services/api";
import {
  FiGrid,
  FiUsers,
  FiCheckCircle,
  FiAlertCircle,
  FiFilter,
  FiDownload,
  FiPlus,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiEdit2,
  FiMonitor,
  FiServer,
  FiSmartphone,
  FiPrinter,
  FiUserPlus,
  FiRefreshCw,
  FiFileText,
} from "react-icons/fi";
import "./Departments.css";

// ── Constants ─────────────────────────────────────────────────────────────────

const HEAD_COLORS = ["#2563eb", "#16a34a", "#ea580c", "#7c3aed", "#0891b2", "#be185d", "#dc2626"];

const TABS = [
  { key: "all",    label: "All"          },
  { key: "active", label: "Active"       },
  { key: "large",  label: "Large Teams"  },
  { key: "small",  label: "Small Teams"  },
  { key: "high",   label: "High Workload"},
];

const CAT_ICONS = {
  Laptops:    { Icon: FiMonitor,    color: "#2563eb" },
  Desktops:   { Icon: FiMonitor,    color: "#0891b2" },
  Servers:    { Icon: FiServer,     color: "#7c3aed" },
  Monitors:   { Icon: FiMonitor,    color: "#6b7280" },
  Printers:   { Icon: FiPrinter,    color: "#ea580c" },
  Networking: { Icon: FiServer,     color: "#16a34a" },
  Other:      { Icon: FiSmartphone, color: "#d97706" },
};

// ── New Department Modal ──────────────────────────────────────────────────────

const EMPTY_DEPT = { name: "", description: "", head: "", location: "" };

function NewDepartmentModal({ onClose, onCreated }) {
  const [form,      setForm]      = useState(EMPTY_DEPT);
  const [errors,    setErrors]    = useState({});
  const [banner,    setBanner]    = useState("");
  const [saving,    setSaving]    = useState(false);
  const [users,     setUsers]     = useState([]);
  const firstRef = useRef(null);

  useEffect(() => {
    firstRef.current?.focus();
    api.get("accounts/users/?page_size=200")
      .then(r => setUsers(r.data.results))
      .catch(() => {});
  }, []);

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(er => ({ ...er, [field]: "" }));
    setBanner("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = "Department name is required.";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      const payload = {
        name:        form.name.trim(),
        description: form.description.trim(),
        location:    form.location.trim(),
        head:        form.head || null,
      };
      await api.post("accounts/departments/", payload);
      onCreated();
      onClose();
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        const fieldErrors = {};
        let hasField = false;
        for (const [k, v] of Object.entries(data)) {
          if (["name", "description", "location", "head"].includes(k)) {
            fieldErrors[k] = Array.isArray(v) ? v.join(" ") : v;
            hasField = true;
          }
        }
        if (hasField) setErrors(fieldErrors);
        else setBanner(data.detail || data.non_field_errors?.[0] || "Something went wrong.");
      } else {
        setBanner("Server error. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ndm-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ndm-card">
        {/* Header */}
        <div className="ndm-header">
          <h2 className="ndm-title">New Department</h2>
          <button className="ndm-close" onClick={onClose}><FiX size={18} /></button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="ndm-body">
            {banner && <div className="ndm-err-banner">{banner}</div>}

            {/* Name */}
            <div className="ndm-field">
              <label className="ndm-label">Department Name <span className="ndm-required">*</span></label>
              <div className="ndm-input-wrap">
                <input
                  ref={firstRef}
                  className={`ndm-input ${errors.name ? "ndm-input-err" : ""}`}
                  placeholder="e.g. Information Technology"
                  value={form.name}
                  onChange={set("name")}
                />
              </div>
              {errors.name && <span className="ndm-field-err">{errors.name}</span>}
            </div>

            {/* Head */}
            <div className="ndm-field">
              <label className="ndm-label">Department Head</label>
              <div className="ndm-input-wrap">
                <select
                  className={`ndm-select ${errors.head ? "ndm-input-err" : ""}`}
                  value={form.head}
                  onChange={set("head")}
                >
                  <option value="">— No head assigned —</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              {errors.head && <span className="ndm-field-err">{errors.head}</span>}
            </div>

            {/* Location */}
            <div className="ndm-field">
              <label className="ndm-label">Location</label>
              <div className="ndm-input-wrap">
                <input
                  className={`ndm-input ${errors.location ? "ndm-input-err" : ""}`}
                  placeholder="e.g. Building A, Floor 2"
                  value={form.location}
                  onChange={set("location")}
                />
              </div>
              {errors.location && <span className="ndm-field-err">{errors.location}</span>}
            </div>

            {/* Description */}
            <div className="ndm-field">
              <label className="ndm-label">Description</label>
              <textarea
                className={`ndm-input ndm-textarea ${errors.description ? "ndm-input-err" : ""}`}
                placeholder="Brief description of this department's responsibilities..."
                rows={3}
                value={form.description}
                onChange={set("description")}
              />
              {errors.description && <span className="ndm-field-err">{errors.description}</span>}
            </div>
          </div>

          {/* Footer */}
          <div className="ndm-footer">
            <button type="button" className="ndm-btn-cancel" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="ndm-btn-submit" disabled={saving}>
              {saving ? "Creating…" : "Create Department"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Department Drawer ─────────────────────────────────────────────────────────

function DeptDrawer({ dept, detail, onClose }) {
  const isOpen = !!dept;
  const headColor = dept ? HEAD_COLORS[(dept.id - 1) % HEAD_COLORS.length] : "#2563eb";

  return (
    <>
      {isOpen && <div className="dep-overlay" onClick={onClose} />}
      <aside className={`dep-drawer ${isOpen ? "dep-drawer-open" : ""}`}>
        {dept && (
          <>
            <div className="dep-drawer-header">
              <span>Department Details</span>
              <button className="dep-drawer-close" onClick={onClose}><FiX size={18} /></button>
            </div>

            <div className="dep-drawer-identity">
              <div className="dep-drawer-avatar" style={{ background: headColor + "22", color: headColor }}>
                {dept.head_initials}
              </div>
              <div className="dep-drawer-identity-info">
                <h2 className="dep-drawer-dept-name">{dept.name}</h2>
                <p className="dep-drawer-head">Head: <span style={{ color: "#2563eb" }}>{dept.head_name ?? "—"}</span></p>
                <div className="dep-drawer-badges">
                  <span className="dep-badge dep-badge-active">ACTIVE</span>
                  <span className="dep-badge dep-badge-members">{dept.employees_count} Members</span>
                </div>
              </div>
            </div>

            <div className="dep-drawer-body">
              <section className="dep-drawer-section">
                <h3 className="dep-drawer-section-title">ABOUT DEPARTMENT</h3>
                <p className="dep-drawer-about">{dept.description || "No description available."}</p>
              </section>

              <section className="dep-drawer-section">
                <h3 className="dep-drawer-section-title">ASSET DISTRIBUTION</h3>
                <div className="dep-asset-grid">
                  {detail?.asset_distribution?.length > 0 ? (
                    detail.asset_distribution.slice(0, 4).map((a) => {
                      const { Icon, color } = CAT_ICONS[a.category] ?? { Icon: FiMonitor, color: "#6b7280" };
                      return (
                        <div key={a.category} className="dep-asset-item">
                          <Icon size={20} color={color} />
                          <span className="dep-asset-count">{a.count}</span>
                          <span className="dep-asset-label">{a.category}</span>
                        </div>
                      );
                    })
                  ) : (
                    <>
                      <div className="dep-asset-item"><FiMonitor size={20} color="#2563eb" /><span className="dep-asset-count">0</span><span className="dep-asset-label">Workstations</span></div>
                      <div className="dep-asset-item"><FiServer size={20} color="#7c3aed" /><span className="dep-asset-count">0</span><span className="dep-asset-label">Servers</span></div>
                      <div className="dep-asset-item"><FiSmartphone size={20} color="#16a34a" /><span className="dep-asset-count">0</span><span className="dep-asset-label">Mobile</span></div>
                      <div className="dep-asset-item"><FiPrinter size={20} color="#ea580c" /><span className="dep-asset-count">0</span><span className="dep-asset-label">Peripherals</span></div>
                    </>
                  )}
                </div>
              </section>

              <section className="dep-drawer-section">
                <h3 className="dep-drawer-section-title">EMPLOYEE HIGHLIGHTS</h3>
                <div className="dep-highlights">
                  <div className="dep-highlight-item">
                    <span className="dep-hl-num" style={{ color: "#16a34a" }}>{dept.employees_count}</span>
                    <span className="dep-hl-label">Total Staff</span>
                  </div>
                  <div className="dep-highlight-item">
                    <span className="dep-hl-num" style={{ color: "#2563eb" }}>{dept.assets_count}</span>
                    <span className="dep-hl-label">Assets</span>
                  </div>
                  <div className="dep-highlight-item">
                    <span className="dep-hl-num" style={{ color: "#ea580c" }}>{dept.open_tickets_count}</span>
                    <span className="dep-hl-label">Open Tickets</span>
                  </div>
                </div>
              </section>
            </div>

            <div className="dep-drawer-footer">
              <div className="dep-drawer-footer-row">
                <button className="dep-btn-secondary"><FiEdit2 size={14} /> Edit Dept</button>
                <button className="dep-btn-primary"><FiMonitor size={14} /> Assign Assets</button>
              </div>
              <button className="dep-btn-outline">
                <FiUsers size={14} /> Manage All {dept.employees_count} Employees
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Departments() {
  const [activeTab,     setActiveTab]     = useState("all");
  const [search,        setSearch]        = useState("");
  const [selectedDept,  setSelectedDept]  = useState(null);
  const [deptDetail,    setDeptDetail]    = useState(null);
  const [page,          setPage]          = useState(1);
  const [showModal,     setShowModal]     = useState(false);

  const [stats,         setStats]         = useState(null);
  const [departments,   setDepartments]   = useState([]);
  const [totalCount,    setTotalCount]    = useState(0);
  const [empDist,       setEmpDist]       = useState([]);
  const [ticketLoad,    setTicketLoad]    = useState(null);
  const [topPerforming, setTopPerforming] = useState([]);

  const PAGE_SIZE  = 10;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const loadDepts = async (pg = 1, q = search) => {
    try {
      const params = new URLSearchParams({ page: pg });
      if (q) params.set('search', q);
      const res = await api.get(`accounts/departments/?${params}`);
      setDepartments(res.data.results);
      setTotalCount(res.data.count);
    } catch (err) { console.error("Departments load error:", err); }
  };

  const refreshAll = async () => {
    try {
      const [statsRes, empRes, loadRes, topRes] = await Promise.all([
        api.get("accounts/departments/stats/"),
        api.get("accounts/departments/employee-dist/"),
        api.get("accounts/departments/ticket-load/"),
        api.get("accounts/departments/top-performing/"),
      ]);
      setStats(statsRes.data);
      setEmpDist(empRes.data);
      setTicketLoad(loadRes.data);
      setTopPerforming(topRes.data);
    } catch (err) { console.error("Departments refresh error:", err); }
    await loadDepts(1, search);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [statsRes, empRes, loadRes, topRes] = await Promise.all([
          api.get("accounts/departments/stats/"),
          api.get("accounts/departments/employee-dist/"),
          api.get("accounts/departments/ticket-load/"),
          api.get("accounts/departments/top-performing/"),
        ]);
        setStats(statsRes.data);
        setEmpDist(empRes.data);
        setTicketLoad(loadRes.data);
        setTopPerforming(topRes.data);
      } catch (err) { console.error("Departments init error:", err); }
      await loadDepts(1, "");
    };
    init();
  }, []);

  const handleRowClick = async (dept) => {
    setSelectedDept(dept);
    setDeptDetail(null);
    try {
      const res = await api.get(`accounts/departments/${dept.id}/`);
      setDeptDetail(res.data);
    } catch (err) { console.error("Dept detail error:", err); }
  };

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearch(q);
    setPage(1);
    loadDepts(1, q);
  };

  const handlePage = (pg) => {
    if (pg < 1 || pg > totalPages) return;
    setPage(pg);
    loadDepts(pg, search);
  };

  // Client-side tab filtering (size/workload not in DB — computed from counts)
  const filtered = departments.filter((d) => {
    if (activeTab === "large")  return d.employees_count > 20;
    if (activeTab === "small")  return d.employees_count <= 20;
    if (activeTab === "high")   return d.open_tickets_count > 5;
    return true; // "all" and "active"
  });

  // Ticket load donut
  const donutR = 44;
  const donutC = 2 * Math.PI * donutR;
  const totalOpen    = ticketLoad?.total    ?? 0;
  const generalPct   = totalOpen ? (ticketLoad?.general  ?? 0) / totalOpen : 0;
  const criticalPct  = totalOpen ? (ticketLoad?.critical ?? 0) / totalOpen : 0;
  const generalDash  = donutC * generalPct;
  const criticalDash = donutC * criticalPct;

  const statCards = [
    { Icon: FiGrid,        label: "TOTAL DEPARTMENTS",  value: stats?.total_departments  ?? "—", note: "",          noteColor: "#2563eb", color: "#2563eb", bg: "#eff6ff" },
    { Icon: FiUsers,       label: "TOTAL EMPLOYEES",    value: stats?.total_employees    ?? "—", note: "",          noteColor: "#16a34a", color: "#16a34a", bg: "#f0fdf4" },
    { Icon: FiCheckCircle, label: "ACTIVE DEPARTMENTS", value: stats?.active_departments ?? "—", note: "All active",noteColor: "#16a34a", color: "#16a34a", bg: "#f0fdf4" },
    { Icon: FiAlertCircle, label: "OPEN TICKETS",       value: stats?.open_tickets       ?? "—", note: "",          noteColor: "#dc2626", color: "#ea580c", bg: "#fff7ed" },
  ];

  return (
    <div className="dep-page">
      {/* ── Page header ── */}
      <div className="dep-page-header">
        <div>
          <h1 className="dep-page-title">Departments</h1>
          <p className="dep-page-sub">Manage organizational departments, department heads, employees and IT resources.</p>
        </div>
        <div className="dep-header-actions">
          <button className="dep-btn-ghost"><FiFilter size={15} /> Filter</button>
          <button className="dep-btn-ghost"><FiDownload size={15} /> Export</button>
          <button className="dep-btn-new" onClick={() => setShowModal(true)}><FiPlus size={15} /> New Department</button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="dep-stats-row">
        {statCards.map((s) => (
          <div key={s.label} className="dep-stat-card">
            <div className="dep-stat-icon-wrap" style={{ background: s.bg }}>
              <s.Icon size={22} color={s.color} />
            </div>
            <div className="dep-stat-info">
              <p className="dep-stat-label">{s.label}</p>
              <p className="dep-stat-value">{s.value}</p>
              {s.note && <p className="dep-stat-note" style={{ color: s.noteColor }}>{s.note}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* ── Body ── */}
      <div className="dep-body">
        {/* Left: table card */}
        <div className="dep-table-card">
          <div className="dep-table-toolbar">
            <div className="dep-tabs">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  className={`dep-tab ${activeTab === t.key ? "dep-tab-active" : ""}`}
                  onClick={() => setActiveTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="dep-search-wrap">
              <FiSearch size={14} className="dep-search-icon" />
              <input className="dep-search" placeholder="Search by name..." value={search} onChange={handleSearch} />
            </div>
          </div>

          <div className="dep-table-wrap">
            <table className="dep-table">
              <thead>
                <tr>
                  <th>ID</th><th>NAME</th><th>HEAD</th>
                  <th>EMPLOYEES</th><th>ASSETS</th><th>TICKETS</th><th>LOCATION</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", color: "#94a3b8", padding: "2rem" }}>
                      No departments found
                    </td>
                  </tr>
                ) : filtered.map((d, idx) => {
                  const headColor = HEAD_COLORS[(d.id - 1) % HEAD_COLORS.length];
                  const ticketColor = d.open_tickets_count === 0 ? "#6b7280"
                    : d.open_tickets_count > 10 ? "#dc2626" : "#ea580c";
                  return (
                    <tr
                      key={d.id}
                      className={`dep-row ${selectedDept?.id === d.id ? "dep-row-selected" : ""}`}
                      onClick={() => handleRowClick(d)}
                    >
                      <td className="dep-cell-id">{d.dept_id}</td>
                      <td className="dep-cell-name">{d.name}</td>
                      <td>
                        <div className="dep-head-cell">
                          <span className="dep-head-avatar" style={{ background: headColor + "22", color: headColor }}>
                            {d.head_initials}
                          </span>
                          <span>{d.head_name ?? "—"}</span>
                        </div>
                      </td>
                      <td>{d.employees_count}</td>
                      <td>{d.assets_count}</td>
                      <td>
                        <span className="dep-ticket-badge" style={{
                          color: d.open_tickets_count === 0 ? "#6b7280" : ticketColor,
                          background: d.open_tickets_count === 0 ? "#f3f4f6" : ticketColor + "15",
                        }}>
                          {d.open_tickets_count}
                        </span>
                      </td>
                      <td className="dep-cell-location">{d.location || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="dep-pagination">
            <span className="dep-pag-info">
              Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} departments
            </span>
            <div className="dep-pag-btns">
              <button className="dep-pag-btn" disabled={page === 1} onClick={() => handlePage(page - 1)}>
                <FiChevronLeft size={15} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(pg => (
                <button key={pg} className={`dep-pag-btn ${page === pg ? "dep-pag-active" : ""}`} onClick={() => handlePage(pg)}>
                  {pg}
                </button>
              ))}
              <button className="dep-pag-btn" disabled={page === totalPages} onClick={() => handlePage(page + 1)}>
                <FiChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Right: widgets */}
        <div className="dep-widgets">
          {/* Quick Actions */}
          <div className="dep-widget-card">
            <h3 className="dep-widget-title">Quick Actions</h3>
            <div className="dep-quick-grid">
              {[
                { Icon: FiGrid,     label: "Create Dept",   action: () => setShowModal(true) },
                { Icon: FiUserPlus, label: "Assign Mgr",    action: null },
                { Icon: FiRefreshCw,label: "Transfer Empl", action: null },
                { Icon: FiFileText, label: "Dept Report",   action: null },
              ].map(({ Icon, label, action }) => (
                <button key={label} className="dep-quick-btn" onClick={action ?? undefined}>
                  <Icon size={18} color="#2563eb" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Employee Distribution */}
          <div className="dep-widget-card">
            <h3 className="dep-widget-title">Employee Distribution</h3>
            <ul className="dep-emp-dist">
              {empDist.length === 0 ? (
                <li style={{ color: "#94a3b8", fontSize: "0.85rem" }}>No data yet</li>
              ) : empDist.map((e, i) => (
                <li key={e.label} className="dep-emp-dist-item">
                  <div className="dep-emp-dist-top">
                    <span className="dep-emp-dist-label">{e.label}</span>
                    <span className="dep-emp-dist-count">{e.count} <span className="dep-emp-dist-pct">({e.pct}%)</span></span>
                  </div>
                  <div className="dep-emp-dist-bar-bg">
                    <div className="dep-emp-dist-bar" style={{ width: `${e.pct * 2.5}%`, background: HEAD_COLORS[i % HEAD_COLORS.length] }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Ticket Load */}
          <div className="dep-widget-card">
            <h3 className="dep-widget-title">Ticket Load</h3>
            <div className="dep-donut-wrap">
              <svg viewBox="0 0 100 100" width="120" height="120">
                <circle cx="50" cy="50" r={donutR} fill="none" stroke="#f3f4f6" strokeWidth="10" />
                <circle cx="50" cy="50" r={donutR} fill="none" stroke="#2563eb" strokeWidth="10"
                  strokeDasharray={`${generalDash} ${donutC}`}
                  strokeDashoffset={donutC * 0.25}
                  strokeLinecap="butt" transform="rotate(-90 50 50)" />
                <circle cx="50" cy="50" r={donutR} fill="none" stroke="#f97316" strokeWidth="10"
                  strokeDasharray={`${criticalDash} ${donutC}`}
                  strokeDashoffset={-generalDash + donutC * 0.25}
                  strokeLinecap="butt" transform="rotate(-90 50 50)" />
                <text x="50" y="46" textAnchor="middle" fontSize="16" fontWeight="700" fill="#111827">{totalOpen}</text>
                <text x="50" y="58" textAnchor="middle" fontSize="7" fill="#6b7280">OPEN</text>
              </svg>
              <div className="dep-donut-legend">
                <div className="dep-legend-item"><span className="dep-legend-dot" style={{ background: "#2563eb" }} /><span>General ({ticketLoad?.general_pct ?? 0}%)</span></div>
                <div className="dep-legend-item"><span className="dep-legend-dot" style={{ background: "#f97316" }} /><span>Critical ({ticketLoad?.critical_pct ?? 0}%)</span></div>
              </div>
            </div>
          </div>

          {/* Top Performing */}
          <div className="dep-widget-card">
            <h3 className="dep-widget-title">Top Performing</h3>
            <ul className="dep-top-list">
              {topPerforming.length === 0 ? (
                <li style={{ color: "#94a3b8", fontSize: "0.85rem" }}>No data yet</li>
              ) : topPerforming.map((t) => (
                <li key={t.id} className="dep-top-item">
                  <span className="dep-top-avatar" style={{ background: t.color + "22", color: t.color }}>{t.initials}</span>
                  <div className="dep-top-info">
                    <p className="dep-top-name">{t.name}</p>
                    <p className="dep-top-head">{t.head ?? "—"}</p>
                  </div>
                  <span className="dep-top-sla">{t.open_tickets ?? 0}<br /><span>Tickets</span></span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Detail Drawer ── */}
      <DeptDrawer dept={selectedDept} detail={deptDetail} onClose={() => { setSelectedDept(null); setDeptDetail(null); }} />

      {/* ── New Department Modal ── */}
      {showModal && (
        <NewDepartmentModal
          onClose={() => setShowModal(false)}
          onCreated={refreshAll}
        />
      )}
    </div>
  );
}
