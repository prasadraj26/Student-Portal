import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getExamById } from "../services/examService";
import { getQuestions } from "../services/questionService";
import { getAttemptsByExam } from "../services/attemptService";
import { getStudentById } from "../services/studentService";

const ARROW = "M19 12H5M12 5l-7 7 7 7";

export default function ResultDetail() {
  const { examId } = useParams();
  const navigate   = useNavigate();

  const [exam,      setExam]      = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempts,  setAttempts]  = useState([]);
  const [students,  setStudents]  = useState({});
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [e, q, a] = await Promise.all([
          getExamById(examId),
          getQuestions(examId),
          getAttemptsByExam(examId),
        ]);
        const submitted = a.filter((at) => at.status === "submitted");
        setExam(e); setQuestions(q); setAttempts(submitted);

        // Fetch student names
        const map = {};
        await Promise.all(
          submitted.map(async (at) => {
            if (!map[at.studentId]) {
              const s = await getStudentById(at.studentId);
              map[at.studentId] = s;
            }
          })
        );
        setStudents(map);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, [examId]);

  if (loading) return <div className="loading-center"><div className="spinner spinner-lg" /></div>;
  if (!exam)   return <div className="empty-state"><h3>Exam not found.</h3></div>;

  const sorted = [...attempts].sort((a, b) => (b.percentage || 0) - (a.percentage || 0));
  const avg    = attempts.length ? Math.round(attempts.reduce((s, a) => s + (a.percentage||0), 0) / attempts.length) : 0;
  const high   = attempts.length ? Math.max(...attempts.map((a) => a.percentage||0)) : 0;
  const low    = attempts.length ? Math.min(...attempts.map((a) => a.percentage||0)) : 0;

  return (
    <div>
      <div style={{ marginBottom: 6 }}>
        <button className="btn btn-ghost btn-sm" style={{ color: "var(--text-muted)" }}
          onClick={() => navigate("/results")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={ARROW} /></svg>
          Back to Results
        </button>
      </div>

      <div className="page-header">
        <div>
          <h1>{exam.title}</h1>
          <p style={{ fontSize: 13, marginTop: 3 }}>
            {exam.className} &middot; {exam.subjectName} &middot; {exam.totalMarks} marks &middot; {exam.durationMinutes} min
          </p>
        </div>
      </div>

      {/* Summary stats */}
      {attempts.length > 0 && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          {[
            { label: "Submissions", value: attempts.length, color: "var(--primary)" },
            { label: "Class Average", value: `${avg}%`, color: avg >= 50 ? "var(--success)" : "var(--danger)" },
            { label: "Highest", value: `${high}%`, color: "var(--success)" },
            { label: "Lowest",  value: `${low}%`,  color: "var(--danger)"  },
          ].map(({ label, value, color }) => (
            <div key={label} className="stat-card">
              <div className="stat-card-value" style={{ color }}>{value}</div>
              <div className="stat-card-label">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Results table */}
      {attempts.length === 0 ? (
        <div className="empty-state card" style={{ padding: 60 }}>
          <div className="empty-icon">📊</div>
          <h3>No submissions yet</h3>
          <p>No students have submitted this exam.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1fr" : "1fr", gap: 20 }}>
          {/* Left — list */}
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Student</th>
                  <th>Score</th>
                  <th>%</th>
                  <th>Result</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((at, i) => {
                  const stu = students[at.studentId];
                  const pass = (at.percentage || 0) >= 40;
                  return (
                    <tr key={at.id} style={{ background: selected?.id === at.id ? "var(--bg-secondary)" : "" }}>
                      <td className="text-muted">#{i + 1}</td>
                      <td>
                        <div>
                          <strong>{stu?.name || at.studentId}</strong>
                          <div className="text-muted" style={{ fontSize: 11 }}>ID: {at.studentId}</div>
                        </div>
                      </td>
                      <td><strong>{at.score}/{at.totalMarks}</strong></td>
                      <td>
                        <span style={{ fontWeight: 700, fontSize: 15,
                          color: pass ? "var(--success-text)" : "var(--danger-text)" }}>
                          {at.percentage}%
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${pass ? "badge-success" : "badge-danger"}`}>
                          {pass ? "Pass" : "Fail"}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-ghost btn-sm"
                          onClick={() => setSelected(selected?.id === at.id ? null : at)}>
                          {selected?.id === at.id ? "Close" : "Review"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Right — answer review */}
          {selected && (
            <div className="card" style={{ maxHeight: 600, overflow: "auto" }}>
              <div className="card-header">
                <h3>Answer Review — {students[selected.studentId]?.name || selected.studentId}</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
              </div>
              <div className="card-body" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                {questions.map((q, i) => {
                  const ans = (selected.answers || []).find((a) => a.questionId === q.id);
                  const givenVal = ans?.value ?? "";
                  const correct = String(q.correctAnswer).trim().toLowerCase();
                  const given   = String(givenVal).trim().toLowerCase();
                  const isCorrect = q.type === "numerical"
                    ? parseFloat(given) === parseFloat(correct)
                    : given === correct;
                  return (
                    <div key={q.id} style={{
                      padding: "10px 14px", borderRadius: "var(--radius)",
                      border: `1px solid ${isCorrect ? "var(--success-border)" : "var(--danger-border)"}`,
                      background: isCorrect ? "var(--success-bg)" : "var(--danger-bg)",
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4,
                        color: isCorrect ? "var(--success-text)" : "var(--danger-text)" }}>
                        Q{i+1} — {isCorrect ? "✓ Correct" : "✗ Incorrect"} ({q.marks} marks)
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text-primary)", marginBottom: 4 }}>{q.text}</div>
                      <div style={{ fontSize: 12 }}>
                        <span style={{ color: "var(--text-muted)" }}>Answer: </span>
                        <strong>{String(givenVal) || <em>No answer</em>}</strong>
                      </div>
                      {!isCorrect && (
                        <div style={{ fontSize: 12, color: "var(--success-text)", marginTop: 2 }}>
                          Correct: <strong>{q.correctAnswer}</strong>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
