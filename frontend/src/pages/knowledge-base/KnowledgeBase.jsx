import { useState } from "react";
import {
  FiFilter, FiDownload, FiPlus, FiSearch, FiX,
  FiFileText, FiCheckCircle, FiEdit, FiShare2,
  FiEye, FiArchive, FiClock, FiChevronLeft, FiChevronRight,
} from "react-icons/fi";
import "./KnowledgeBase.css";

// ─── Data ────────────────────────────────────────────────────────────────────

const articles = [
  {
    id: "KB-001",
    title: "Resetting LDAP Password",
    subtitle: "Step-by-step guide for domain p...",
    category: "ACCOUNTS",
    categoryColor: "#7c3aed",
    categoryBg: "#faf5ff",
    author: "John Doe",
    authorInitials: "JD",
    authorColor: "#2563eb",
    views: 1245,
    status: "Published",
    lastUpdated: "Oct 24, 2023, 14:32",
    totalViews: "1,245 times",
    categoryFull: "Accounts & Access",
    abstract:
      "This article provides comprehensive steps for IT technicians and end-users to reset their LDAP/Active Directory passwords using the internal self-service portal. It covers common error codes and troubleshooting steps for locked accounts.",
  },
  {
    id: "KB-002",
    title: "VPN Configuration (macOS)",
    subtitle: "How to set up Cisco AnyConnect ...",
    category: "NETWORK",
    categoryColor: "#0891b2",
    categoryBg: "#ecfeff",
    author: "Sarah Admin",
    authorInitials: "SA",
    authorColor: "#16a34a",
    views: 842,
    status: "Published",
    lastUpdated: "Oct 22, 2023, 09:15",
    totalViews: "842 times",
    categoryFull: "Network",
    abstract:
      "Detailed configuration guide for setting up Cisco AnyConnect VPN on macOS devices. Covers certificate installation, split tunneling configuration, and common connectivity issues.",
  },
  {
    id: "KB-003",
    title: "Office 365 Setup",
    subtitle: "General installation steps for new...",
    category: "SOFTWARE",
    categoryColor: "#16a34a",
    categoryBg: "#f0fdf4",
    author: "Robert King",
    authorInitials: "RK",
    authorColor: "#ea580c",
    views: 3120,
    status: "Published",
    lastUpdated: "Oct 20, 2023, 11:00",
    totalViews: "3,120 times",
    categoryFull: "Software",
    abstract:
      "Step-by-step instructions for deploying Microsoft Office 365 for new employees. Includes license assignment, activation steps, and configuration of Outlook email client.",
  },
  {
    id: "KB-004",
    title: "Legacy Printer Drivers",
    subtitle: "Old drivers for HP Laserjet 400 s...",
    category: "HARDWARE",
    categoryColor: "#b45309",
    categoryBg: "#fffbeb",
    author: "Mark Lee",
    authorInitials: "ML",
    authorColor: "#7c3aed",
    views: 154,
    status: "Draft",
    lastUpdated: "Oct 18, 2023, 16:45",
    totalViews: "154 times",
    categoryFull: "Hardware",
    abstract:
      "Archive of legacy printer drivers for HP Laserjet 400 series devices. Includes Windows 10 compatibility patches and installation notes for IT administrators.",
  },
  {
    id: "KB-005",
    title: "Security Patch 2023-11",
    subtitle: "Urgent updates required for all W...",
    category: "SECURITY",
    categoryColor: "#dc2626",
    categoryBg: "#fef2f2",
    author: "Sarah Admin",
    authorInitials: "SA",
    authorColor: "#16a34a",
    views: 56,
    status: "Published",
    lastUpdated: "Oct 17, 2023, 08:30",
    totalViews: "56 times",
    categoryFull: "Security",
    abstract:
      "Critical security patches for November 2023 affecting all Windows workstations. Addresses CVE-2023-44487 (HTTP/2 Rapid Reset) and three privilege escalation vulnerabilities.",
  },
];

const CATEGORY_TABS = ["All", "Hardware", "Software", "Network", "Security", "Email", "Accounts"];

const popularCategories = [
  { label: "Software", pct: 45, color: "#2563eb" },
  { label: "Hardware", pct: 32, color: "#2563eb" },
  { label: "Security", pct: 18, color: "#2563eb" },
];

const mostViewed = [
  { title: "Resetting LDAP Password", views: "1,245 views" },
  { title: "Office 365 Setup", views: "982 views" },
  { title: "Wi-Fi Guest Access", views: "741 views" },
];

const recentlyUpdated = [
  { title: "VPN Config Ventura", meta: "Updated 2h ago by Sarah" },
  { title: "Security Patch 2023-11", meta: "Updated 5h ago by Robert" },
];

// ─── Article Status Donut ─────────────────────────────────────────────────────
function StatusDonut() {
  const total = 186, published = 162, drafts = 18;
  const r = 52, cx = 65, cy = 65, circ = 2 * Math.PI * r;
  const pubDash = (published / total) * circ;
  const draftDash = (drafts / total) * circ;
  return (
    <svg viewBox="0 0 130 130" width={130} height={130}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth="14" />
      {/* published arc */}
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="#2563eb" strokeWidth="14"
        strokeDasharray={`${pubDash} ${circ - pubDash}`}
        strokeDashoffset={circ * 0.25}
        transform={`rotate(-90 ${cx} ${cy})`}
        strokeLinecap="butt"
      />
      {/* drafts arc */}
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="#f97316" strokeWidth="14"
        strokeDasharray={`${draftDash} ${circ - draftDash}`}
        strokeDashoffset={circ * 0.25 - pubDash}
        transform={`rotate(-90 ${cx} ${cy})`}
        strokeLinecap="butt"
      />
      <text x={cx} y={cx - 6} textAnchor="middle" fontSize="18" fontWeight="700" fill="#111827">186</text>
      <text x={cx} y={cx + 10} textAnchor="middle" fontSize="9" fill="#9ca3af">TOTAL</text>
    </svg>
  );
}

// ─── Article Detail Drawer ────────────────────────────────────────────────────
function ArticleDrawer({ article, onClose }) {
  const isOpen = !!article;
  return (
    <>
      {isOpen && <div className="kb-overlay" onClick={onClose} />}
      <aside className={`kb-drawer ${isOpen ? "kb-drawer-open" : ""}`}>
        {article && (
          <>
            {/* Header */}
            <div className="kb-drawer-header">
              <div className="kb-drawer-header-left">
                <span className="kb-drawer-id">{article.id}</span>
                <span className={`kb-drawer-status ${article.status === "Published" ? "kb-status-pub" : "kb-status-draft"}`}>
                  {article.status}
                </span>
              </div>
              <button className="kb-drawer-close" onClick={onClose}><FiX size={17} /></button>
            </div>

            <div className="kb-drawer-body">
              {/* Title */}
              <h2 className="kb-drawer-title">{article.title}</h2>

              {/* Meta grid */}
              <div className="kb-drawer-meta">
                <div className="kb-meta-item">
                  <span className="kb-meta-label">AUTHOR</span>
                  <div className="kb-meta-author">
                    <span className="kb-meta-avatar"
                      style={{ background: article.authorColor + "22", color: article.authorColor }}>
                      {article.authorInitials}
                    </span>
                    <span className="kb-meta-val">{article.author}</span>
                  </div>
                </div>
                <div className="kb-meta-item">
                  <span className="kb-meta-label">CATEGORY</span>
                  <span className="kb-meta-val">{article.categoryFull}</span>
                </div>
                <div className="kb-meta-item">
                  <span className="kb-meta-label">LAST UPDATED</span>
                  <span className="kb-meta-val">{article.lastUpdated}</span>
                </div>
                <div className="kb-meta-item">
                  <span className="kb-meta-label">TOTAL VIEWS</span>
                  <span className="kb-meta-val">{article.totalViews}</span>
                </div>
              </div>

              {/* Abstract */}
              <div className="kb-drawer-section">
                <h3 className="kb-drawer-section-title">Abstract</h3>
                <p className="kb-drawer-abstract">{article.abstract}</p>
              </div>

              {/* Content Preview */}
              <div className="kb-drawer-section">
                <div className="kb-preview-header">
                  <h3 className="kb-drawer-section-title" style={{ margin: 0 }}>CONTENT PREVIEW</h3>
                  <FiEye size={14} color="#9ca3af" />
                </div>
                <div className="kb-preview-box">
                  <div className="kb-skeleton kb-sk-full" />
                  <div className="kb-skeleton kb-sk-full" />
                  <div className="kb-skeleton kb-sk-three-q" />
                  <div className="kb-skeleton kb-sk-full" />
                  <div className="kb-skeleton kb-sk-half" />
                  <div className="kb-preview-img">
                    <FiFileText size={28} color="#d1d5db" />
                  </div>
                  <div className="kb-skeleton kb-sk-full" />
                  <div className="kb-skeleton kb-sk-two-q" />
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="kb-drawer-footer">
              <div className="kb-drawer-footer-row">
                <button className="kb-btn-primary"><FiEye size={13} /> View Full</button>
                <button className="kb-btn-secondary"><FiEdit size={13} /> Edit</button>
              </div>
              <div className="kb-drawer-footer-row">
                <button className="kb-btn-outline"><FiShare2 size={13} /> Share</button>
                <button className="kb-btn-danger"><FiArchive size={13} /> Archive</button>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function KnowledgeBase() {
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState(null);

  const filtered = articles.filter((a) => {
    const matchTab =
      activeTab === "All" ||
      a.category.toLowerCase() === activeTab.toLowerCase() ||
      a.categoryFull.toLowerCase().includes(activeTab.toLowerCase());
    const matchSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.author.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div className="kb-page">
      {/* ── Page header ── */}
      <div className="kb-page-header">
        <div>
          <h1 className="kb-page-title">Knowledge Base</h1>
          <p className="kb-page-sub">Create, organize and manage IT support articles, guides and documentation.</p>
        </div>
        <div className="kb-header-actions">
          <button className="kb-btn-ghost"><FiFilter size={13} /> Filter</button>
          <button className="kb-btn-ghost"><FiDownload size={13} /> Export</button>
          <button className="kb-btn-new"><FiPlus size={14} /> New Article</button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="kb-stats-row">
        <div className="kb-stat-card">
          <div className="kb-stat-icon" style={{ background: "#eff6ff" }}>
            <FiFileText size={22} color="#2563eb" />
          </div>
          <div>
            <p className="kb-stat-label">Total Articles</p>
            <p className="kb-stat-value">186</p>
          </div>
        </div>
        <div className="kb-stat-card">
          <div className="kb-stat-icon" style={{ background: "#f0fdf4" }}>
            <FiCheckCircle size={22} color="#16a34a" />
          </div>
          <div>
            <p className="kb-stat-label">Published</p>
            <p className="kb-stat-value" style={{ color: "#16a34a" }}>162</p>
          </div>
        </div>
        <div className="kb-stat-card">
          <div className="kb-stat-icon" style={{ background: "#fff7ed" }}>
            <FiEdit size={22} color="#ea580c" />
          </div>
          <div>
            <p className="kb-stat-label">Drafts</p>
            <p className="kb-stat-value" style={{ color: "#ea580c" }}>18</p>
          </div>
        </div>
        <div className="kb-stat-card">
          <div className="kb-stat-icon" style={{ background: "#eff6ff" }}>
            <FiArchive size={22} color="#2563eb" />
          </div>
          <div>
            <p className="kb-stat-label">Categories</p>
            <p className="kb-stat-value" style={{ color: "#2563eb" }}>12</p>
          </div>
        </div>
      </div>

      {/* ── Body: article list + right widgets ── */}
      <div className="kb-body">
        {/* Left: article list */}
        <div className="kb-list-card">
          {/* Filter pills + search */}
          <div className="kb-toolbar">
            <div className="kb-toolbar-top">
              <div className="kb-pills-wrap">
                <div className="kb-pills">
                  {CATEGORY_TABS.map((t) => (
                    <button
                      key={t}
                      className={`kb-pill ${activeTab === t ? "kb-pill-active" : ""}`}
                      onClick={() => setActiveTab(t)}
                    >{t}</button>
                  ))}
                </div>
              </div>
              <div className="kb-search-wrap">
                <FiSearch size={13} className="kb-search-icon" />
                <input
                  className="kb-search"
                  placeholder="Search articles..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="kb-table-wrap">
            <table className="kb-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>TITLE</th>
                  <th>CATEGORY</th>
                  <th>AUTHOR</th>
                  <th>VIEWS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr
                    key={a.id}
                    className={`kb-row ${selectedArticle?.id === a.id ? "kb-row-selected" : ""}`}
                    onClick={() => setSelectedArticle(a)}
                  >
                    <td className="kb-cell-id">{a.id}</td>
                    <td className="kb-cell-title">
                      <p className="kb-title-main">{a.title}</p>
                      <p className="kb-title-sub">{a.subtitle}</p>
                    </td>
                    <td>
                      <span className="kb-cat-badge"
                        style={{ color: a.categoryColor, background: a.categoryBg }}>
                        {a.category}
                      </span>
                    </td>
                    <td>
                      <div className="kb-author-cell">
                        <span className="kb-author-avatar"
                          style={{ background: a.authorColor + "22", color: a.authorColor }}>
                          {a.authorInitials}
                        </span>
                        <span className="kb-author-name">{a.author}</span>
                      </div>
                    </td>
                    <td className="kb-cell-views">{a.views.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="kb-pagination">
            <span className="kb-pag-info">Showing 1-{filtered.length} of 186 articles</span>
            <div className="kb-pag-btns">
              <button className="kb-pag-btn"><FiChevronLeft size={14} /> Previous</button>
              <button className="kb-pag-btn kb-pag-next">Next <FiChevronRight size={14} /></button>
            </div>
          </div>
        </div>

        {/* Right: widgets */}
        <div className="kb-widgets">
          {/* Quick Actions */}
          <div className="kb-widget-card">
            <div className="kb-quick-grid">
              {[
                { Icon: FiPlus, label: "CREATE" },
                { Icon: FiShare2, label: "SHARE" },
                { Icon: FiEye, label: "REVIEW" },
                { Icon: FiCheckCircle, label: "AUDIT" },
              ].map(({ Icon, label }) => (
                <button key={label} className="kb-quick-btn">
                  <Icon size={20} color="#374151" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Article Status */}
          <div className="kb-widget-card">
            <h3 className="kb-widget-title">Article Status</h3>
            <div className="kb-status-wrap">
              <StatusDonut />
              <div className="kb-status-legend">
                <div className="kb-legend-item">
                  <span className="kb-legend-dot" style={{ background: "#2563eb" }} />
                  <span>Published</span>
                  <strong>162</strong>
                </div>
                <div className="kb-legend-item">
                  <span className="kb-legend-dot" style={{ background: "#f97316" }} />
                  <span>Drafts</span>
                  <strong>18</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Popular Categories */}
          <div className="kb-widget-card">
            <h3 className="kb-widget-title">Popular Categories</h3>
            <ul className="kb-pop-list">
              {popularCategories.map((c) => (
                <li key={c.label} className="kb-pop-item">
                  <div className="kb-pop-top">
                    <span className="kb-pop-label">{c.label}</span>
                    <span className="kb-pop-pct">{c.pct}%</span>
                  </div>
                  <div className="kb-pop-bar-bg">
                    <div className="kb-pop-bar" style={{ width: `${c.pct}%`, background: c.color }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Most Viewed */}
          <div className="kb-widget-card">
            <h3 className="kb-widget-title">Most Viewed</h3>
            <ul className="kb-viewed-list">
              {mostViewed.map((v, i) => (
                <li key={v.title} className="kb-viewed-item">
                  <span className="kb-viewed-rank">{i + 1}</span>
                  <div>
                    <p className="kb-viewed-title">{v.title}</p>
                    <p className="kb-viewed-views">{v.views}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Recently Updated */}
          <div className="kb-widget-card">
            <h3 className="kb-widget-title">Recently Updated</h3>
            <ul className="kb-recent-list">
              {recentlyUpdated.map((r) => (
                <li key={r.title} className="kb-recent-item">
                  <div className="kb-recent-bar" />
                  <div>
                    <p className="kb-recent-title">{r.title}</p>
                    <p className="kb-recent-meta">
                      <FiClock size={10} /> {r.meta}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Article detail drawer */}
      <ArticleDrawer article={selectedArticle} onClose={() => setSelectedArticle(null)} />
    </div>
  );
}
