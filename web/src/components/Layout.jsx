import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import "./Layout.css";

/* ── Inline SVG icon set ── */
const Icon = ({ name, size = 18 }) => {
  const icons = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    students:  <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    classes:   <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    subjects:  <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>,
    exams:     <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>,
    results:   <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    reports:   <><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>,
    settings:  <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    logout:    <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    menu:      <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>,
    close:     <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    chevronR:  <><polyline points="9 18 15 12 9 6"/></>,
  };
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round"
    >
      {icons[name]}
    </svg>
  );
};

const NAV = [
  { to: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { to: "/students",  icon: "students",  label: "Students"  },
  { to: "/classes",   icon: "classes",   label: "Classes"   },
  { to: "/subjects",  icon: "subjects",  label: "Subjects"  },
  { to: "/exams",     icon: "exams",     label: "Exams"     },
  { to: "/results",   icon: "results",   label: "Results"   },
  { to: "/reports",   icon: "reports",   label: "Reports"   },
  { to: "/settings",  icon: "settings",  label: "Settings"  },
];

export default function Layout() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try { await signOut(auth); navigate("/login"); }
    catch (e) { console.error(e); }
  };

  const initials = currentUser?.email
    ? currentUser.email[0].toUpperCase()
    : "T";

  return (
    <div className="layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`sidebar ${sidebarOpen ? "sidebar--open" : ""}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">EP</div>
          <span className="sidebar-logo-text">EduPortal</span>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <span className="sidebar-section-label">Main</span>
          {NAV.slice(0, 5).map(({ to, icon, label }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "sidebar-link--active" : ""}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <Icon name={icon} />
              <span>{label}</span>
            </NavLink>
          ))}

          <span className="sidebar-section-label" style={{ marginTop: 16 }}>Analytics</span>
          {NAV.slice(5, 7).map(({ to, icon, label }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "sidebar-link--active" : ""}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <Icon name={icon} />
              <span>{label}</span>
            </NavLink>
          ))}

          <span className="sidebar-section-label" style={{ marginTop: 16 }}>System</span>
          {NAV.slice(7).map(({ to, icon, label }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "sidebar-link--active" : ""}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <Icon name={icon} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">Teacher</span>
              <span className="sidebar-user-email">{currentUser?.email}</span>
            </div>
          </div>
          <button className="sidebar-logout-btn" onClick={handleLogout} title="Logout">
            <Icon name="logout" size={16} />
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="layout-main">
        {/* Header */}
        <header className="layout-header">
          <button
            className="hamburger"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <Icon name={sidebarOpen ? "close" : "menu"} />
          </button>
          <div className="header-spacer" />
          <div className="header-right">
            <div className="header-avatar">{initials}</div>
          </div>
        </header>

        {/* Page content */}
        <main className="layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/* Export Icon so pages can import it too */
export { Icon };
