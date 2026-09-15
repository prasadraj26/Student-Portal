import { useNavigate } from "react-router-dom";

const Ico = ({ d, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {typeof d === "string" ? <path d={d} /> : d}
  </svg>
);

const REPORTS = [
  {
    title: "Exam Report",
    desc: "View results for a specific exam — class average, score distribution, and per-student breakdown.",
    icon: "📝", path: "/results", color: "#0A1F44",
  },
  {
    title: "Student Report",
    desc: "Individual student analytics — performance trend over time, subject breakdown, and weak areas.",
    icon: "👤", path: "/students", color: "#12B76A",
  },
  {
    title: "Class Report",
    desc: "Compare performance across all students in a class for a given subject or time period.",
    icon: "🏫", path: "/results", color: "#F2B705",
  },
];

export default function Reports() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p style={{ fontSize: 13, marginTop: 3 }}>
            Access detailed analytics and reports across students, exams, and classes.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 32 }}>
        {REPORTS.map(({ title, desc, icon, path, color }) => (
          <div key={title} className="card" style={{
            cursor: "pointer", transition: "box-shadow 0.18s, transform 0.18s",
          }}
            onClick={() => navigate(path)}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{
              height: 6, background: color, borderRadius: "12px 12px 0 0",
            }} />
            <div className="card-body" style={{ padding: 24 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
              <h3 style={{ marginBottom: 8 }}>{title}</h3>
              <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{desc}</p>
              <div style={{ marginTop: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)" }}>
                  Go to {title} →
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* How to access */}
      <div className="card">
        <div className="card-header"><h3>How to access reports</h3></div>
        <div className="card-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {[
              { step: "1", title: "Exam Report", desc: "Go to Results → Select an exam → Click View Results" },
              { step: "2", title: "Student Report", desc: "Go to Students → Find a student → Click Report" },
              { step: "3", title: "Class Overview", desc: "Go to Results → Filter by class via exam name" },
            ].map(({ step, title, desc }) => (
              <div key={step} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{
                  width: 30, height: 30, background: "var(--primary)", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 13, color: "#fff", flexShrink: 0,
                }}>{step}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2, lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
