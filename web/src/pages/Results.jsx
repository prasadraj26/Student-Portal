import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getExams } from "../services/examService";
import { getAttemptsByExam } from "../services/attemptService";

const ARROW = <polyline points="9 18 15 12 9 6" />;
const Ico = ({ d, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {typeof d === "string" ? <path d={d} /> : d}
  </svg>
);

export default function Results() {
  const navigate = useNavigate();
  const [exams,   setExams]   = useState([]);
  const [counts,  setCounts]  = useState({});
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("closed");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const all = await getExams();
        setExams(all);
        // Load submission counts for closed exams
        const closed = all.filter((e) => e.status === "closed" || e.status === "published");
        const countMap = {};
        await Promise.all(
          closed.map(async (e) => {
            const attempts = await getAttemptsByExam(e.id);
            const submitted = attempts.filter((a) => a.status === "submitted");
            countMap[e.id] = {
              count: submitted.length,
              avg: submitted.length
                ? Math.round(submitted.reduce((s, a) => s + (a.percentage || 0), 0) / submitted.length)
                : null,
            };
          })
        );
        setCounts(countMap);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = exams.filter((e) =>
    filter === "all" ? true : e.status === filter
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Results</h1>
          <p style={{ fontSize: 13, marginTop: 3 }}>View exam results and student performance data.</p>
        </div>
      </div>

      <div className="tabs">
        {["closed","published","all"].map((f) => (
          <button key={f} className={`tab-btn ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}>
            {f === "all" ? "All Exams" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner spinner-lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state card" style={{ padding: 60 }}>
          <div className="empty-icon">📊</div>
          <h3>No {filter} exams</h3>
          <p>Results will appear here once exams are closed.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((exam) => {
            const data = counts[exam.id];
            return (
              <div key={exam.id} className="card" style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ fontSize: 15 }}>{exam.title}</strong>
                    <div style={{ display: "flex", gap: 16, marginTop: 4, flexWrap: "wrap" }}>
                      {exam.className  && <span className="text-muted" style={{ fontSize: 12 }}>🏫 {exam.className}</span>}
                      {exam.subjectName&& <span className="text-muted" style={{ fontSize: 12 }}>📚 {exam.subjectName}</span>}
                      <span className="text-muted" style={{ fontSize: 12 }}>📊 {exam.totalMarks} marks</span>
                    </div>
                  </div>

                  {/* Submission stats */}
                  {data ? (
                    <div style={{ display: "flex", gap: 24, flexShrink: 0 }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: "var(--primary)" }}>{data.count}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Submissions</div>
                      </div>
                      {data.avg !== null && (
                        <div style={{ textAlign: "center" }}>
                          <div style={{
                            fontSize: 22, fontWeight: 700,
                            color: data.avg >= 50 ? "var(--success-text)" : "var(--danger-text)",
                          }}>{data.avg}%</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Class Avg</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ color: "var(--text-muted)", fontSize: 13 }}>No submissions yet</div>
                  )}

                  <button className="btn btn-primary btn-sm"
                    onClick={() => navigate(`/results/${exam.id}`)}>
                    View Results <Ico d={ARROW} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
