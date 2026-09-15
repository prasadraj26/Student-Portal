import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getStudentCount } from "../services/studentService";
import { getExams } from "../services/examService";
import { getActiveClasses } from "../services/classService";
import { getActiveSubjects } from "../services/subjectService";

const Icon = ({ name, size = 20 }) => {
  const icons = {
    students: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    exams:    <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>,
    check:    <><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>,
    classes:  <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    plus:     <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    arrow:    <><polyline points="9 18 15 12 9 6"/></>,
    clock:    <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
};

function StatCard({ icon, label, value, color = "var(--primary)", loading }) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon" style={{ background: `${color}14` }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </svg>
      </div>
      {loading
        ? <div style={{ height: 30, width: 60, background: "var(--bg-secondary)", borderRadius: 6, animation: "pulse 1.2s infinite" }} />
        : <div className="stat-card-value">{value}</div>
      }
      <div className="stat-card-label">{label}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    draft:     { cls: "badge-warning",  label: "Draft"     },
    published: { cls: "badge-success",  label: "Published" },
    closed:    { cls: "badge-danger",   label: "Closed"    },
    archived:  { cls: "badge-neutral",  label: "Archived"  },
  };
  const { cls, label } = map[status] || { cls: "badge-neutral", label: status };
  return <span className={`badge ${cls}`}>{label}</span>;
}

export default function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats]   = useState({ students: "-", active: "-", completed: "-", classes: "-" });
  const [exams, setExams]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [total, allExams, classes, subjects] = await Promise.all([
          getStudentCount(),
          getExams(),
          getActiveClasses(),
          getActiveSubjects(),
        ]);
        const active    = allExams.filter((e) => e.status === "published").length;
        const completed = allExams.filter((e) => e.status === "closed").length;
        setStats({ students: total, active, completed, classes: classes.length });
        setExams(allExams.slice(0, 6));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1>{greet()}, Teacher 👋</h1>
          <p style={{ marginTop: 3, fontSize: 13, color: "var(--text-muted)" }}>
            {currentUser?.email} &mdash; {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => navigate("/students")}>
            <Icon name="students" size={15} /> Add Student
          </button>
          <button className="btn btn-primary" onClick={() => navigate("/exams/create")}>
            <Icon name="plus" size={15} /> Create Exam
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <StatCard
          icon={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}
          label="Total Students" value={stats.students} loading={loading}
        />
        <StatCard
          icon={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>}
          label="Active Exams" value={stats.active} loading={loading}
          color="var(--success)"
        />
        <StatCard
          icon={<><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>}
          label="Completed Exams" value={stats.completed} loading={loading}
          color="var(--warning)"
        />
        <StatCard
          icon={<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>}
          label="Active Classes" value={stats.classes} loading={loading}
          color="#7C3AED"
        />
      </div>

      {/* Bottom grid */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>

        {/* Recent Exams */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Exams</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate("/exams")}>
              View all <Icon name="arrow" size={13} />
            </button>
          </div>
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : exams.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Icon name="exams" size={40} /></div>
              <h3>No exams yet</h3>
              <p>Create your first exam to get started.</p>
              <button className="btn btn-primary btn-sm" onClick={() => navigate("/exams/create")}>
                Create Exam
              </button>
            </div>
          ) : (
            <div className="table-container" style={{ borderRadius: "0 0 12px 12px", border: "none" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Class</th>
                    <th>Status</th>
                    <th>Duration</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((exam) => (
                    <tr key={exam.id}>
                      <td><strong>{exam.title}</strong></td>
                      <td>{exam.className || exam.classId}</td>
                      <td><StatusBadge status={exam.status} /></td>
                      <td className="text-muted">{exam.durationMinutes} min</td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => navigate(`/exams/${exam.id}`)}
                        >
                          View <Icon name="arrow" size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card">
            <div className="card-header"><h3>Quick Actions</h3></div>
            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Add Student",    path: "/students",     icon: "students" },
                { label: "Create Exam",    path: "/exams/create", icon: "exams"    },
                { label: "View Results",   path: "/results",      icon: "check"    },
                { label: "Manage Classes", path: "/classes",      icon: "classes"  },
              ].map(({ label, path, icon }) => (
                <button
                  key={path}
                  className="btn btn-secondary"
                  style={{ justifyContent: "flex-start", width: "100%" }}
                  onClick={() => navigate(path)}
                >
                  <Icon name={icon} size={15} /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Tip card */}
          <div className="card" style={{ background: "rgba(10,31,68,0.04)", border: "1px solid rgba(10,31,68,0.1)" }}>
            <div className="card-body" style={{ padding: 16 }}>
              <p style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600, marginBottom: 4 }}>
                💡 Pro Tip
              </p>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Publish exams only when students are ready. Use <strong>Draft</strong> to preview
                before making it available.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}