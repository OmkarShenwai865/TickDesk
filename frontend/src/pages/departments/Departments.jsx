import { useState } from "react";
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

// ── Stat cards ──────────────────────────────────────────────────────────────
const stats = [
  {
    Icon: FiGrid,
    label: "TOTAL DEPARTMENTS",
    value: "12",
    note: "+2 this month",
    noteColor: "#2563eb",
    color: "#2563eb",
    bg: "#eff6ff",
  },
  {
    Icon: FiUsers,
    label: "TOTAL EMPLOYEES",
    value: "248",
    note: "+15 new hires",
    noteColor: "#16a34a",
    color: "#16a34a",
    bg: "#f0fdf4",
  },
  {
    Icon: FiCheckCircle,
    label: "ACTIVE DEPARTMENTS",
    value: "11",
    note: "92% online",
    noteColor: "#16a34a",
    color: "#16a34a",
    bg: "#f0fdf4",
  },
  {
    Icon: FiAlertCircle,
    label: "OPEN TICKETS",
    value: "34",
    note: "8 critical",
    noteColor: "#dc2626",
    color: "#ea580c",
    bg: "#fff7ed",
  },
];

// ── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "large", label: "Large Teams" },
  { key: "small", label: "Small Teams" },
  { key: "high", label: "High Workload" },
];

// ── Department data ───────────────────────────────────────────────────────────
const departments = [
  {
    id: "DEP-001",
    name: "Information Technology",
    head: "David Chen",
    headInitials: "DC",
    headColor: "#2563eb",
    employees: 48,
    assets: 132,
    tickets: 16,
    ticketColor: "#dc2626",
    location: "Floor 3",
    status: "active",
    size: "large",
    workload: "high",
    about:
      "The IT department manages core technological infrastructure, cloud deployments, and employee technical support. They oversee enterprise security protocols and internal tool development.",
    assets_dist: { workstations: 52, servers: 12, mobile: 45, peripherals: 23 },
    activity: [
      { icon: "user", text: "New Employee joined IT Infrastructure team.", time: "2 hours ago" },
      { icon: "asset", text: "12 Assets transferred from Warehouse.", time: "Yesterday at 4:30 PM" },
      { icon: "policy", text: "Policy Updated for data encryption.", time: "Oct 24, 2023" },
    ],
    topSla: 95,
    members: 48,
    photo: null,
  },
  {
    id: "DEP-002",
    name: "Finance & Payroll",
    head: "Sarah Miller",
    headInitials: "SM",
    headColor: "#16a34a",
    employees: 22,
    assets: 45,
    tickets: 3,
    ticketColor: "#2563eb",
    location: "Floor 2",
    status: "active",
    size: "small",
    workload: "normal",
    about:
      "Finance & Payroll manages company budgets, payroll processing, and financial reporting. They ensure compliance with tax regulations and oversee vendor payments.",
    assets_dist: { workstations: 20, servers: 2, mobile: 18, peripherals: 8 },
    activity: [
      { icon: "policy", text: "Q3 Budget report generated.", time: "1 day ago" },
      { icon: "user", text: "New accountant onboarded.", time: "3 days ago" },
    ],
    topSla: 92,
    members: 22,
    photo: null,
  },
  {
    id: "DEP-003",
    name: "Human Resources",
    head: "Anita Jones",
    headInitials: "AJ",
    headColor: "#ea580c",
    employees: 18,
    assets: 38,
    tickets: 12,
    ticketColor: "#ea580c",
    location: "Floor 1",
    status: "active",
    size: "small",
    workload: "high",
    about:
      "HR manages recruitment, employee relations, performance reviews, and compliance. They are the bridge between management and staff for policy implementation.",
    assets_dist: { workstations: 16, servers: 1, mobile: 14, peripherals: 7 },
    activity: [
      { icon: "user", text: "3 new hires onboarded this week.", time: "2 days ago" },
      { icon: "policy", text: "Updated leave policy distributed.", time: "1 week ago" },
    ],
    topSla: 88,
    members: 18,
    photo: null,
  },
  {
    id: "DEP-004",
    name: "Marketing & Comms",
    head: "Robert Lee",
    headInitials: "RL",
    headColor: "#7c3aed",
    employees: 35,
    assets: 82,
    tickets: 1,
    ticketColor: "#2563eb",
    location: "Floor 4",
    status: "active",
    size: "large",
    workload: "normal",
    about:
      "Marketing & Communications handles brand management, digital campaigns, and internal/external communications. They drive lead generation and company visibility.",
    assets_dist: { workstations: 30, servers: 3, mobile: 28, peripherals: 15 },
    activity: [
      { icon: "asset", text: "New MacBooks assigned to design team.", time: "3 days ago" },
      { icon: "user", text: "Campaign manager joined.", time: "1 week ago" },
    ],
    topSla: 90,
    members: 35,
    photo: null,
  },
  {
    id: "DEP-005",
    name: "Legal & Compliance",
    head: "Karen White",
    headInitials: "KW",
    headColor: "#0891b2",
    employees: 12,
    assets: 24,
    tickets: 0,
    ticketColor: "#6b7280",
    location: "Floor 2",
    status: "active",
    size: "small",
    workload: "normal",
    about:
      "Legal & Compliance handles regulatory adherence, contract reviews, and risk management. They protect the organization from legal exposure and ensure policy compliance.",
    assets_dist: { workstations: 10, servers: 1, mobile: 8, peripherals: 5 },
    activity: [
      { icon: "policy", text: "GDPR compliance audit completed.", time: "5 days ago" },
    ],
    topSla: 97,
    members: 12,
    photo: null,
  },
  {
    id: "DEP-006",
    name: "Operations",
    head: "James Patel",
    headInitials: "JP",
    headColor: "#be185d",
    employees: 40,
    assets: 95,
    tickets: 8,
    ticketColor: "#dc2626",
    location: "Floor 1",
    status: "active",
    size: "large",
    workload: "high",
    about:
      "Operations ensures smooth day-to-day functioning of the business, including logistics, facilities, and cross-departmental coordination.",
    assets_dist: { workstations: 35, servers: 5, mobile: 30, peripherals: 20 },
    activity: [
      { icon: "asset", text: "Equipment audit completed.", time: "Yesterday" },
      { icon: "user", text: "2 staff promoted to senior roles.", time: "1 week ago" },
    ],
    topSla: 85,
    members: 40,
    photo: null,
  },
];

// ── Department Drawer ─────────────────────────────────────────────────────────
function DeptDrawer({ dept, onClose }) {
  const isOpen = !!dept;
  return (
    <>
      {isOpen && <div className="dep-overlay" onClick={onClose} />}
      <aside className={`dep-drawer ${isOpen ? "dep-drawer-open" : ""}`}>
        {dept && (
          <>
            {/* Header */}
            <div className="dep-drawer-header">
              <div className="dep-drawer-title">
                <span>Department Details</span>
              </div>
              <button className="dep-drawer-close" onClick={onClose}>
                <FiX size={18} />
              </button>
            </div>

            {/* Identity */}
            <div className="dep-drawer-identity">
              <div
                className="dep-drawer-avatar"
                style={{ background: dept.headColor + "22", color: dept.headColor }}
              >
                {dept.headInitials}
              </div>
              <div className="dep-drawer-identity-info">
                <h2 className="dep-drawer-dept-name">{dept.name}</h2>
                <p className="dep-drawer-head">Head: <span style={{ color: "#2563eb" }}>{dept.head}</span></p>
                <div className="dep-drawer-badges">
                  <span className="dep-badge dep-badge-active">ACTIVE</span>
                  <span className="dep-badge dep-badge-members">{dept.members} Members</span>
                </div>
              </div>
            </div>

            <div className="dep-drawer-body">
              {/* About */}
              <section className="dep-drawer-section">
                <h3 className="dep-drawer-section-title">ABOUT DEPARTMENT</h3>
                <p className="dep-drawer-about">{dept.about}</p>
              </section>

              {/* Asset Distribution */}
              <section className="dep-drawer-section">
                <h3 className="dep-drawer-section-title">ASSET DISTRIBUTION</h3>
                <div className="dep-asset-grid">
                  <div className="dep-asset-item">
                    <FiMonitor size={20} color="#2563eb" />
                    <span className="dep-asset-count">{dept.assets_dist.workstations}</span>
                    <span className="dep-asset-label">Workstations</span>
                  </div>
                  <div className="dep-asset-item">
                    <FiServer size={20} color="#7c3aed" />
                    <span className="dep-asset-count">{dept.assets_dist.servers}</span>
                    <span className="dep-asset-label">Servers</span>
                  </div>
                  <div className="dep-asset-item">
                    <FiSmartphone size={20} color="#16a34a" />
                    <span className="dep-asset-count">{dept.assets_dist.mobile}</span>
                    <span className="dep-asset-label">Mobile Devices</span>
                  </div>
                  <div className="dep-asset-item">
                    <FiPrinter size={20} color="#ea580c" />
                    <span className="dep-asset-count">{dept.assets_dist.peripherals}</span>
                    <span className="dep-asset-label">Peripherals</span>
                  </div>
                </div>
              </section>

              {/* Recent Activity */}
              <section className="dep-drawer-section">
                <div className="dep-activity-header">
                  <h3 className="dep-drawer-section-title">RECENT ACTIVITY</h3>
                  <button className="dep-view-all">View All</button>
                </div>
                <ul className="dep-activity-list">
                  {dept.activity.map((a, i) => (
                    <li key={i} className="dep-activity-item">
                      <div className={`dep-activity-icon dep-activity-icon-${a.icon}`}>
                        {a.icon === "user" && <FiUserPlus size={13} />}
                        {a.icon === "asset" && <FiMonitor size={13} />}
                        {a.icon === "policy" && <FiFileText size={13} />}
                      </div>
                      <div className="dep-activity-text">
                        <p>{a.text}</p>
                        <span>{a.time}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Employee Highlights */}
              <section className="dep-drawer-section">
                <h3 className="dep-drawer-section-title">EMPLOYEE HIGHLIGHTS</h3>
                <div className="dep-highlights">
                  <div className="dep-highlight-item">
                    <span className="dep-hl-num" style={{ color: "#16a34a" }}>{dept.members}</span>
                    <span className="dep-hl-label">Total Staff</span>
                  </div>
                  <div className="dep-highlight-item">
                    <span className="dep-hl-num" style={{ color: "#2563eb" }}>{dept.topSla}%</span>
                    <span className="dep-hl-label">SLA Score</span>
                  </div>
                  <div className="dep-highlight-item">
                    <span className="dep-hl-num" style={{ color: "#ea580c" }}>{dept.tickets}</span>
                    <span className="dep-hl-label">Open Tickets</span>
                  </div>
                </div>
              </section>
            </div>

            {/* Footer actions */}
            <div className="dep-drawer-footer">
              <div className="dep-drawer-footer-row">
                <button className="dep-btn-secondary">
                  <FiEdit2 size={14} /> Edit Dept
                </button>
                <button className="dep-btn-primary">
                  <FiMonitor size={14} /> Assign Assets
                </button>
              </div>
              <button className="dep-btn-outline">
                <FiUsers size={14} /> Manage All {dept.members} Employees
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
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState(null);
  const [page, setPage] = useState(1);

  const filtered = departments.filter((d) => {
    const matchTab =
      activeTab === "all" ||
      (activeTab === "active" && d.status === "active") ||
      (activeTab === "large" && d.size === "large") ||
      (activeTab === "small" && d.size === "small") ||
      (activeTab === "high" && d.workload === "high");
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.head.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  // Employee distribution data
  const empDist = [
    { label: "Information Tech", count: 48, pct: 19, color: "#2563eb" },
    { label: "Operations", count: 84, pct: 34, color: "#1d4ed8" },
    { label: "Finance", count: 22, pct: 9, color: "#1e3a5f" },
  ];

  // Ticket load donut
  const donutR = 44;
  const donutC = 2 * Math.PI * donutR;
  const generalPct = 0.60;
  const criticalPct = 0.25;
  const generalDash = donutC * generalPct;
  const criticalDash = donutC * criticalPct;
  const criticalOffset = -(donutC * generalPct);

  // Top performing
  const topPerforming = [
    { initials: "IT", name: "Infra Tech", head: "David Chen", sla: 95, color: "#2563eb" },
    { initials: "FN", name: "Finance", head: "Sarah Miller", sla: 92, color: "#16a34a" },
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
          <button className="dep-btn-new"><FiPlus size={15} /> New Department</button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="dep-stats-row">
        {stats.map((s) => {
          const Icon = s.Icon;
          return (
            <div key={s.label} className="dep-stat-card">
              <div className="dep-stat-icon-wrap" style={{ background: s.bg }}>
                <Icon size={22} color={s.color} />
              </div>
              <div className="dep-stat-info">
                <p className="dep-stat-label">{s.label}</p>
                <p className="dep-stat-value">{s.value}</p>
                <p className="dep-stat-note" style={{ color: s.noteColor }}>{s.note}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Body: table + sidebar widgets ── */}
      <div className="dep-body">
        {/* Left: table card */}
        <div className="dep-table-card">
          {/* Toolbar */}
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
              <input
                className="dep-search"
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="dep-table-wrap">
            <table className="dep-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>NAME</th>
                  <th>HEAD</th>
                  <th>EMPLOYEES</th>
                  <th>ASSETS</th>
                  <th>TICKETS</th>
                  <th>LOCATION</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr
                    key={d.id}
                    className={`dep-row ${selectedDept?.id === d.id ? "dep-row-selected" : ""}`}
                    onClick={() => setSelectedDept(d)}
                  >
                    <td className="dep-cell-id">{d.id}</td>
                    <td className="dep-cell-name">{d.name}</td>
                    <td>
                      <div className="dep-head-cell">
                        <span
                          className="dep-head-avatar"
                          style={{ background: d.headColor + "22", color: d.headColor }}
                        >
                          {d.headInitials}
                        </span>
                        <span>{d.head}</span>
                      </div>
                    </td>
                    <td>{d.employees}</td>
                    <td>{d.assets}</td>
                    <td>
                      <span
                        className="dep-ticket-badge"
                        style={{
                          color: d.tickets === 0 ? "#6b7280" : d.ticketColor,
                          background: d.tickets === 0 ? "#f3f4f6" : d.ticketColor + "15",
                        }}
                      >
                        {d.tickets}
                      </span>
                    </td>
                    <td className="dep-cell-location">{d.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="dep-pagination">
            <span className="dep-pag-info">Showing 1-{filtered.length} of {filtered.length} departments</span>
            <div className="dep-pag-btns">
              <button
                className="dep-pag-btn"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <FiChevronLeft size={15} />
              </button>
              <button className="dep-pag-btn dep-pag-active">1</button>
              <button className="dep-pag-btn" onClick={() => setPage(2)}>2</button>
              <button
                className="dep-pag-btn"
                onClick={() => setPage((p) => p + 1)}
              >
                <FiChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Right: widget column */}
        <div className="dep-widgets">
          {/* Quick Actions */}
          <div className="dep-widget-card">
            <h3 className="dep-widget-title">Quick Actions</h3>
            <div className="dep-quick-grid">
              {[
                { Icon: FiGrid, label: "Create Dept" },
                { Icon: FiUserPlus, label: "Assign Mgr" },
                { Icon: FiRefreshCw, label: "Transfer Empl" },
                { Icon: FiFileText, label: "Dept Report" },
              ].map(({ Icon, label }) => (
                <button key={label} className="dep-quick-btn">
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
              {empDist.map((e) => (
                <li key={e.label} className="dep-emp-dist-item">
                  <div className="dep-emp-dist-top">
                    <span className="dep-emp-dist-label">{e.label}</span>
                    <span className="dep-emp-dist-count">
                      {e.count} <span className="dep-emp-dist-pct">({e.pct}%)</span>
                    </span>
                  </div>
                  <div className="dep-emp-dist-bar-bg">
                    <div
                      className="dep-emp-dist-bar"
                      style={{ width: `${e.pct * 2.5}%`, background: e.color }}
                    />
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
                {/* background ring */}
                <circle cx="50" cy="50" r={donutR} fill="none" stroke="#f3f4f6" strokeWidth="10" />
                {/* general segment */}
                <circle
                  cx="50" cy="50" r={donutR} fill="none"
                  stroke="#2563eb" strokeWidth="10"
                  strokeDasharray={`${generalDash} ${donutC}`}
                  strokeDashoffset={donutC * 0.25}
                  strokeLinecap="butt"
                  transform="rotate(-90 50 50)"
                />
                {/* critical segment */}
                <circle
                  cx="50" cy="50" r={donutR} fill="none"
                  stroke="#f97316" strokeWidth="10"
                  strokeDasharray={`${criticalDash} ${donutC}`}
                  strokeDashoffset={-generalDash + donutC * 0.25}
                  strokeLinecap="butt"
                  transform="rotate(-90 50 50)"
                />
                <text x="50" y="46" textAnchor="middle" fontSize="16" fontWeight="700" fill="#111827">34</text>
                <text x="50" y="58" textAnchor="middle" fontSize="7" fill="#6b7280">OPEN</text>
              </svg>
              <div className="dep-donut-legend">
                <div className="dep-legend-item">
                  <span className="dep-legend-dot" style={{ background: "#2563eb" }} />
                  <span>General (60%)</span>
                </div>
                <div className="dep-legend-item">
                  <span className="dep-legend-dot" style={{ background: "#f97316" }} />
                  <span>Critical (25%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Performing */}
          <div className="dep-widget-card">
            <h3 className="dep-widget-title">Top Performing</h3>
            <ul className="dep-top-list">
              {topPerforming.map((t) => (
                <li key={t.initials} className="dep-top-item">
                  <span
                    className="dep-top-avatar"
                    style={{ background: t.color + "22", color: t.color }}
                  >
                    {t.initials}
                  </span>
                  <div className="dep-top-info">
                    <p className="dep-top-name">{t.name}</p>
                    <p className="dep-top-head">{t.head}</p>
                  </div>
                  <span className="dep-top-sla">{t.sla}%<br /><span>SLA</span></span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Detail Drawer ── */}
      <DeptDrawer dept={selectedDept} onClose={() => setSelectedDept(null)} />
    </div>
  );
}
