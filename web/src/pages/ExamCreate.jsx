import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createExam, getExamById, updateExam } from "../services/examService";
import { getActiveClasses } from "../services/classService";
import { getActiveSubjects } from "../services/subjectService";

const ARROW = "M19 12H5M12 5l-7 7 7 7";

export default function ExamCreate() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [classes,  setClasses]  = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [message,  setMessage]  = useState(null);

  const [form, setForm] = useState({
    title: "", subjectId: "", classId: "",
    durationMinutes: 60, totalMarks: 100,
    startTime: "", endTime: "", instructions: "",
  });

  useEffect(() => {
    const load = async () => {
      const [c, s] = await Promise.all([getActiveClasses(), getActiveSubjects()]);
      setClasses(c);
      setSubjects(s);
      if (isEdit) {
        const exam = await getExamById(id);
        if (exam) {
          setForm({
            title:           exam.title || "",
            subjectId:       exam.subjectId || "",
            classId:         exam.classId || "",
            durationMinutes: exam.durationMinutes || 60,
            totalMarks:      exam.totalMarks || 100,
            startTime:       exam.startTime || "",
            endTime:         exam.endTime || "",
            instructions:    exam.instructions || "",
          });
        }
      }
      setFetching(false);
    };
    load();
  }, [id, isEdit]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    if (!form.title.trim())   return "Exam title is required.";
    if (!form.classId)         return "Please select a class.";
    if (!form.subjectId)       return "Please select a subject.";
    if (form.durationMinutes < 5) return "Duration must be at least 5 minutes.";
    if (form.totalMarks < 1)   return "Total marks must be at least 1.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setMessage({ type: "error", text: err }); return; }
    setLoading(true);
    setMessage(null);
    try {
      const classObj   = classes.find((c) => c.id === form.classId);
      const subjectObj = subjects.find((s) => s.id === form.subjectId);
      const data = {
        ...form,
        className:   classObj   ? (classObj.name   || `${classObj.grade}${classObj.section}`) : "",
        subjectName: subjectObj ? subjectObj.name : "",
      };
      if (isEdit) {
        await updateExam(id, data);
        setMessage({ type: "success", text: "Exam updated." });
        setTimeout(() => navigate(`/exams/${id}`), 1000);
      } else {
        const examId = await createExam(data);
        setMessage({ type: "success", text: "Exam created! Now add questions." });
        setTimeout(() => navigate(`/exams/${examId}/questions`), 1000);
      }
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="loading-center"><div className="spinner spinner-lg" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm" style={{ marginBottom: 8, color: "var(--text-muted)" }}
            onClick={() => navigate("/exams")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={ARROW} /></svg>
            Back to Exams
          </button>
          <h1>{isEdit ? "Edit Exam" : "Create New Exam"}</h1>
          <p style={{ fontSize: 13, marginTop: 3 }}>
            {isEdit ? "Update exam details. Questions are managed separately." : "Fill in the details. You'll add questions next."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, alignItems: "start" }}>

          {/* Left — Main Details */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card">
              <div className="card-header"><h3>Exam Details</h3></div>
              <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Exam Title *</label>
                  <input type="text" className="form-control"
                    value={form.title} onChange={set("title")}
                    placeholder="e.g. Mid-Term Mathematics Exam" required />
                </div>

                <div className="form-row form-row-2">
                  <div className="form-group">
                    <label className="form-label">Class *</label>
                    <select className="form-control" value={form.classId} onChange={set("classId")} required>
                      <option value="">Select class…</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>{c.name || `Grade ${c.grade} – ${c.section}`}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Subject *</label>
                    <select className="form-control" value={form.subjectId} onChange={set("subjectId")} required>
                      <option value="">Select subject…</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row form-row-2">
                  <div className="form-group">
                    <label className="form-label">Duration (minutes) *</label>
                    <input type="number" className="form-control"
                      value={form.durationMinutes} onChange={set("durationMinutes")}
                      min="5" max="300" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Total Marks *</label>
                    <input type="number" className="form-control"
                      value={form.totalMarks} onChange={set("totalMarks")}
                      min="1" max="1000" required />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Instructions (optional)</label>
                  <textarea className="form-control" rows={3}
                    value={form.instructions} onChange={set("instructions")}
                    placeholder="e.g. Read each question carefully. No calculators allowed." />
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="card">
              <div className="card-header"><h3>Schedule (optional)</h3></div>
              <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <p style={{ fontSize: 13, margin: 0 }}>
                  Set a start and end window. Students can only take the exam within this window.
                  Leave blank for open-ended availability.
                </p>
                <div className="form-row form-row-2">
                  <div className="form-group">
                    <label className="form-label">Start Time</label>
                    <input type="datetime-local" className="form-control"
                      value={form.startTime} onChange={set("startTime")} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Time</label>
                    <input type="datetime-local" className="form-control"
                      value={form.endTime} onChange={set("endTime")} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right — Summary + Save */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card">
              <div className="card-header"><h3>Summary</h3></div>
              <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  ["Title",    form.title || "—"],
                  ["Class",    classes.find((c) => c.id === form.classId)?.name || "—"],
                  ["Subject",  subjects.find((s) => s.id === form.subjectId)?.name || "—"],
                  ["Duration", form.durationMinutes ? `${form.durationMinutes} min` : "—"],
                  ["Marks",    form.totalMarks ? `${form.totalMarks} pts` : "—"],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "var(--text-muted)" }}>{k}</span>
                    <span style={{ fontWeight: 500, color: "var(--text-primary)", maxWidth: 160, textAlign: "right" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: 16 }}>
              {message && (
                <div className={`alert alert-${message.type === "success" ? "success" : "error"}`}
                  style={{ marginBottom: 12 }}>{message.text}</div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={loading}>
                  {loading ? "Saving…" : isEdit ? "Save Changes" : "Create & Add Questions →"}
                </button>
                <button type="button" className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }}
                  onClick={() => navigate("/exams")}>Cancel</button>
              </div>
            </div>

            {isEdit && (
              <div className="card" style={{ padding: 14, background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
                  ✏️ Editing an exam only updates its details.
                  Use the <strong>Questions</strong> page to add or modify questions.
                </p>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
