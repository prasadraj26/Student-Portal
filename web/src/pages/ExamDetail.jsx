import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getExamById, publishExam, closeExam } from "../services/examService";
import { getQuestions } from "../services/questionService";
import { getAttemptsByExam } from "../services/attemptService";

const ARROW = "M19 12H5M12 5l-7 7 7 7";

function StatusBadge({ status }) {
  const map = {
    draft:     { cls: "badge-warning", label: "Draft"     },
    published: { cls: "badge-success", label: "Published" },
    closed:    { cls: "badge-danger",  label: "Closed"    },
    archived:  { cls: "badge-neutral", label: "Archived"  },
  };
  const { cls, label } = map[status] || { cls: "badge-neutral", label: status };
  return <span className={`badge ${cls}`} style={{ fontSize: 13, padding: "4px 10px" }}>{label}</span>;
}

export default function ExamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [exam,      setExam]      = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempts,  setAttempts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [message,   setMessage]   = useState(null);
  const [acting,    setActing]    = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [e, q, a] = await Promise.all([
        getExamById(id),
        getQuestions(id),
        getAttemptsByExam(id),
      ]);
      setExam(e);
      setQuestions(q);
      setAttempts(a.filter((a) => a.status === "submitted"));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handlePublish = async () => {
    if (questions.length === 0) {
      showMsg("error", "Add at least one question before publishing.");
      return;
    }
    setActing(true);
    try { await publishExam(id); showMsg("success", "Exam is now live!"); await load(); }
    catch (e) { showMsg("error", e.message); }
    finally { setActing(false); }
  };

  const handleClose = async () => {
    if (!window.confirm("Close this exam? Students will no longer be able to take it.")) return;
    setActing(true);
    try { await closeExam(id); showMsg("success", "Exam closed."); await load(); }
    catch (e) { showMsg("error", e.message); }
    finally { setActing(false); }
  };

  const avgScore = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / attempts.length)
    : null;

  const qTypeLabel = (type) => ({
    mcq: "MCQ", trueFalse: "True/False", shortAnswer: "Short Answer",
    numerical: "Numerical", formula: "Formula",
  }[type] || type);

  if (loading) return <div className="loading-center"><div className="spinner spinner-lg" /></div>;
  if (!exam) return <div className="empty-state"><h3>Exam not found.</h3></div>;

  return (
    <div>
      {/* Back + Header */}
      <div style={{ marginBottom: 6 }}>
        <button className="btn btn-ghost btn-sm" style={{ color: "var(--text-muted)" }}
          onClick={() => navigate("/exams")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={ARROW} /></svg>
          Back to Exams
        </button>
      </div>

      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0 }}>{exam.title}</h1>
          <StatusBadge status={exam.status} />
        </div>
        <div className="page-header-actions">
          {exam.status === "draft" && (
            <>
              <button className="btn btn-secondary" onClick={() => navigate(`/exams/${id}/edit`)}>Edit</button>
              <button className="btn btn-secondary" onClick={() => navigate(`/exams/${id}/questions`)}>Manage Questions</button>
              <button className="btn btn-success" onClick={handlePublish} disabled={acting}>
                {acting ? "Publishing…" : "Publish Exam"}
              </button>
            </>
          )}
          {exam.status === "published" && (
            <>
              <button className="btn btn-secondary" onClick={() => navigate(`/exams/${id}/questions`)}>Questions</button>
              <button className="btn btn-danger" onClick={handleClose} disabled={acting}>
                {acting ? "Closing…" : "Close Exam"}
              </button>
            </>
          )}
          {exam.status === "closed" && (
            <button className="btn btn-primary" onClick={() => navigate(`/results/${id}`)}>View Results</button>
          )}
        </div>
      </div>

      {message && (
        <div className={`alert alert-${message.type === "success" ? "success" : "error"}`}
          style={{ marginBottom: 20 }}>{message.text}</div>
      )}

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: "Questions",  value: questions.length, icon: "📝" },
          { label: "Total Marks",value: exam.totalMarks,  icon: "📊" },
          { label: "Duration",   value: `${exam.durationMinutes} min`, icon: "⏱" },
          { label: "Submissions",value: attempts.length,  icon: "✅" },
          ...(avgScore !== null ? [{ label: "Avg. Score", value: `${avgScore}%`, icon: "📈" }] : []),
        ].map(({ label, value, icon }) => (
          <div key={label} className="stat-card" style={{ gap: 4, padding: "14px 18px" }}>
            <div style={{ fontSize: 22 }}>{icon}</div>
            <div className="stat-card-value" style={{ fontSize: 24 }}>{value}</div>
            <div className="stat-card-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20 }}>

        {/* Questions list */}
        <div className="card">
          <div className="card-header">
            <h3>Questions ({questions.length})</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/exams/${id}/questions`)}>
              {exam.status === "draft" ? "Add / Edit" : "View"}
            </button>
          </div>
          {questions.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <div className="empty-icon">📝</div>
              <h3>No questions yet</h3>
              <p>Add questions to this exam.</p>
              <button className="btn btn-primary btn-sm" onClick={() => navigate(`/exams/${id}/questions`)}>
                Add Questions
              </button>
            </div>
          ) : (
            <div className="table-container" style={{ border: "none", borderRadius: "0 0 12px 12px" }}>
              <table className="table">
                <thead>
                  <tr><th>#</th><th>Question</th><th>Type</th><th>Marks</th></tr>
                </thead>
                <tbody>
                  {questions.map((q, i) => (
                    <tr key={q.id}>
                      <td className="text-muted" style={{ width: 40 }}>{i + 1}</td>
                      <td style={{ maxWidth: 280 }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box",
                          WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                          {q.text}
                        </span>
                      </td>
                      <td><span className="badge badge-primary">{qTypeLabel(q.type)}</span></td>
                      <td><strong>{q.marks}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Exam info + Recent attempts */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card">
            <div className="card-header"><h3>Details</h3></div>
            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                ["Class",    exam.className || exam.classId],
                ["Subject",  exam.subjectName || exam.subjectId],
                ["Status",   exam.status],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--text-muted)" }}>{k}</span>
                  <span style={{ fontWeight: 500 }}>{v}</span>
                </div>
              ))}
              {exam.instructions && (
                <>
                  <div className="divider" />
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    <strong>Instructions:</strong><br />{exam.instructions}
                  </p>
                </>
              )}
            </div>
          </div>

          {attempts.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3>Recent Submissions</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/results/${id}`)}>All →</button>
              </div>
              <div className="table-container" style={{ border: "none", borderRadius: "0 0 12px 12px" }}>
                <table className="table">
                  <thead><tr><th>Student</th><th>Score</th></tr></thead>
                  <tbody>
                    {attempts.slice(0, 5).map((a) => (
                      <tr key={a.id}>
                        <td><strong>{a.studentId}</strong></td>
                        <td>
                          <span style={{
                            fontWeight: 600,
                            color: a.percentage >= 50 ? "var(--success-text)" : "var(--danger-text)",
                          }}>
                            {a.score}/{a.totalMarks} ({a.percentage}%)
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
