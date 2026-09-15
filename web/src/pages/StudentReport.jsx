import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { getStudentById } from "../services/studentService";
import { getAttemptsByStudent, getStudentProgress } from "../services/attemptService";
import { getExamById } from "../services/examService";

const ARROW = "M19 12H5M12 5l-7 7 7 7";

export default function StudentReport() {
  const { studentId } = useParams();
  const navigate      = useNavigate();

  const [student,   setStudent]   = useState(null);
  const [progress,  setProgress]  = useState(null);
  const [attempts,  setAttempts]  = useState([]);
  const [enriched,  setEnriched]  = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [s, p, a] = await Promise.all([
          getStudentById(studentId),
          getStudentProgress(studentId),
          getAttemptsByStudent(studentId),
        ]);
        setStudent(s); setProgress(p);
        const submitted = a.filter((at) => at.status === "submitted");
        setAttempts(submitted);

        // Enrich with exam details
        const rich = await Promise.all(
          submitted.map(async (at) => {
            const exam = await getExamById(at.examId).catch(() => null);
            return { ...at, examTitle: exam?.title, subjectName: exam?.subjectName };
          })
        );
        // Sort by submitted time
        rich.sort((a, b) => {
          const ta = a.submittedAt?.seconds || 0;
          const tb = b.submittedAt?.seconds || 0;
          return ta - tb;
        });
        setEnriched(rich);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [studentId]);

  if (loading) return <div className="loading-center"><div className="spinner spinner-lg" /></div>;
  if (!student) return <div className="empty-state card" style={{ padding: 60 }}><h3>Student not found.</h3></div>;

  // Build trend data for chart
  const trendData = enriched.map((a, i) => ({
    name: a.examTitle ? a.examTitle.slice(0, 14) + (a.examTitle.length > 14 ? "…" : "") : `Exam ${i + 1}`,
    score: a.percentage || 0,
  }));

  // Subject breakdown from progress doc
  const subjectData = progress?.bySubject
    ? Object.entries(progress.bySubject).map(([id, d]) => ({
        name: id,
        pct: d.percentage || 0,
        exams: d.exams || 0,
      }))
    : [];

  // Weak subjects (< 50%)
  const weakSubjects = subjectData.filter((s) => s.pct < 50);

  return (
    <div>
      <div style={{ marginBottom: 6 }}>
        <button className="btn btn-ghost btn-sm" style={{ color: "var(--text-muted)" }}
          onClick={() => navigate("/students")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={ARROW} /></svg>
          Back to Students
        </button>
      </div>

      {/* Student header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
        <div style={{
          width: 56, height: 56, background: "var(--primary)", borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, fontWeight: 700, color: "#fff",
        }}>
          {student.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <h1 style={{ margin: 0 }}>{student.name}</h1>
          <p style={{ margin: "3px 0 0", fontSize: 13 }}>
            <code style={{ background: "var(--bg-secondary)", padding: "1px 6px", borderRadius: 4, fontSize: 12 }}>
              {student.studentId}
            </code>
            &nbsp; Class {student.classId} &middot;
            <span className={`badge ${student.active ? "badge-success" : "badge-danger"}`} style={{ marginLeft: 8, fontSize: 11 }}>
              {student.active ? "Active" : "Inactive"}
            </span>
          </p>
        </div>
      </div>

      {/* Overview stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: "Exams Taken",     value: progress?.completedExams ?? 0 },
          { label: "Average Score",   value: progress ? `${progress.averagePercentage}%` : "—",
            color: progress?.averagePercentage >= 50 ? "var(--success-text)" : "var(--danger-text)" },
          { label: "Marks Obtained",  value: progress ? `${progress.totalMarksObtained}/${progress.totalMarksPossible}` : "—" },
          { label: "Weak Subjects",   value: weakSubjects.length, color: weakSubjects.length > 0 ? "var(--danger-text)" : "var(--success-text)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-card">
            <div className="stat-card-value" style={{ color: color || "var(--text-primary)" }}>{value}</div>
            <div className="stat-card-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>

        {/* Performance trend */}
        <div className="card">
          <div className="card-header"><h3>Performance Trend</h3></div>
          <div className="card-body">
            {trendData.length < 2 ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <div className="empty-icon">📈</div>
                <h3>Not enough data</h3>
                <p>Student needs at least 2 exam submissions for trend analysis.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                    tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    formatter={(v) => [`${v}%`, "Score"]}
                    contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }}
                  />
                  <Line
                    type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2.5}
                    dot={{ fill: "var(--primary)", r: 4 }}
                    activeDot={{ r: 6, fill: "var(--primary)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Subject breakdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {subjectData.length > 0 && (
            <div className="card">
              <div className="card-header"><h3>Subject Performance</h3></div>
              <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {subjectData.map((s) => (
                  <div key={s.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 500 }}>{s.name}</span>
                      <span style={{ fontWeight: 600,
                        color: s.pct >= 50 ? "var(--success-text)" : "var(--danger-text)" }}>
                        {s.pct}%
                      </span>
                    </div>
                    <div style={{ height: 6, background: "var(--bg-secondary)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 3, width: `${s.pct}%`,
                        background: s.pct >= 50 ? "var(--success)" : "var(--danger)",
                        transition: "width 0.5s ease",
                      }} />
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{s.exams} exam{s.exams !== 1 ? "s" : ""}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {weakSubjects.length > 0 && (
            <div className="card" style={{ border: "1px solid var(--danger-border)", background: "var(--danger-bg)" }}>
              <div className="card-header" style={{ background: "transparent", borderColor: "var(--danger-border)" }}>
                <h3 style={{ color: "var(--danger-text)" }}>⚠ Needs Improvement</h3>
              </div>
              <div className="card-body" style={{ padding: 14 }}>
                {weakSubjects.map((s) => (
                  <div key={s.name} style={{ display: "flex", justifyContent: "space-between",
                    fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: "var(--danger-text)", fontWeight: 500 }}>{s.name}</span>
                    <span className="badge badge-danger">{s.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Attempt history */}
      {enriched.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header"><h3>Exam History</h3></div>
          <div className="table-container" style={{ border: "none", borderRadius: "0 0 12px 12px" }}>
            <table className="table">
              <thead>
                <tr><th>#</th><th>Exam</th><th>Subject</th><th>Score</th><th>%</th><th>Result</th></tr>
              </thead>
              <tbody>
                {enriched.map((at, i) => {
                  const pass = (at.percentage || 0) >= 40;
                  return (
                    <tr key={at.id}>
                      <td className="text-muted">{i + 1}</td>
                      <td><strong>{at.examTitle || at.examId}</strong></td>
                      <td className="text-muted">{at.subjectName || "—"}</td>
                      <td><strong>{at.score}/{at.totalMarks}</strong></td>
                      <td style={{ fontWeight: 700, color: pass ? "var(--success-text)" : "var(--danger-text)" }}>
                        {at.percentage}%
                      </td>
                      <td><span className={`badge ${pass ? "badge-success" : "badge-danger"}`}>{pass ? "Pass" : "Fail"}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
