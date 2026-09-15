import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getExamById } from "../services/examService";
import {
  getQuestions, addQuestion, updateQuestion,
  deleteQuestion, reorderQuestions,
} from "../services/questionService";

const ARROW = "M19 12H5M12 5l-7 7 7 7";
const CLOSE = [<line key="1" x1="18" y1="6" x2="6" y2="18"/>, <line key="2" x1="6" y1="6" x2="18" y2="18"/>];
const PLUS  = [<line key="v" x1="12" y1="5" x2="12" y2="19"/>, <line key="h" x1="5" y1="12" x2="19" y2="12"/>];
const TRASH = <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></>;
const EDIT  = [<path key="1" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>, <path key="2" d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>];

const Ico = ({ d, size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {typeof d === "string" ? <path d={d} /> : d}
  </svg>
);

const Q_TYPES = [
  { id: "mcq",         label: "Multiple Choice", icon: "☑️" },
  { id: "trueFalse",   label: "True / False",    icon: "✔️" },
  { id: "shortAnswer", label: "Short Answer",     icon: "✏️" },
  { id: "numerical",   label: "Numerical",        icon: "🔢" },
  { id: "formula",     label: "Formula",          icon: "🧮" },
];

function qTypeLabel(type) {
  return Q_TYPES.find((q) => q.id === type)?.label || type;
}

const BLANK_FORM = { type: "mcq", text: "", options: ["", "", "", ""], correctAnswer: "", marks: 1 };

function QuestionForm({ initial, totalMarks, onSave, onCancel, loading }) {
  const [form, setForm] = useState(initial || BLANK_FORM);
  const [error, setError] = useState("");

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setOption = (i, v) => {
    const opts = [...form.options];
    opts[i] = v;
    setField("options", opts);
  };

  const validate = () => {
    if (!form.text.trim())           return "Question text is required.";
    if (!form.correctAnswer.toString().trim()) return "Correct answer is required.";
    if (form.type === "mcq") {
      if (form.options.some((o) => !o.trim())) return "All 4 options must be filled.";
      if (!["A","B","C","D"].includes(form.correctAnswer.toUpperCase())) return "Correct answer must be A, B, C, or D.";
    }
    if (form.type === "trueFalse" && !["true","false"].includes(form.correctAnswer.toLowerCase())) {
      return "Correct answer must be true or false.";
    }
    if (form.marks < 1) return "Marks must be at least 1.";
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    const data = { ...form, marks: Number(form.marks) };
    if (form.type === "mcq") data.correctAnswer = data.correctAnswer.toUpperCase();
    if (form.type === "trueFalse") data.correctAnswer = data.correctAnswer.toLowerCase();
    onSave(data);
  };

  return (
    <div className="modal-overlay">
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3>{initial ? "Edit Question" : "Add Question"}</h3>
          <button className="modal-close" onClick={onCancel}><Ico d={CLOSE} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}

            {/* Question type */}
            <div className="form-group">
              <label className="form-label">Question Type</label>
              <div className="q-type-grid">
                {Q_TYPES.map(({ id, label, icon }) => (
                  <button key={id} type="button"
                    className={`q-type-btn ${form.type === id ? "active" : ""}`}
                    onClick={() => setForm({ ...BLANK_FORM, type: id })}
                  >
                    <span style={{ fontSize: 18 }}>{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Question text */}
            <div className="form-group">
              <label className="form-label">
                Question Text *
                {form.type === "formula" && (
                  <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400, marginLeft: 6 }}>
                    (Write the equation/formula the student must solve)
                  </span>
                )}
              </label>
              <textarea className="form-control" rows={3}
                value={form.text} onChange={(e) => setField("text", e.target.value)}
                placeholder={
                  form.type === "formula"  ? "e.g. Solve: 2x + 5 = 15" :
                  form.type === "mcq"      ? "Enter the question…" :
                  form.type === "trueFalse"? "State a fact and ask if it's true or false." :
                  "Enter the question…"
                }
                required />
            </div>

            {/* MCQ Options */}
            {form.type === "mcq" && (
              <div className="form-group">
                <label className="form-label">Options (A – D) *</label>
                {["A", "B", "C", "D"].map((letter, i) => (
                  <div key={letter} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
                    <div style={{
                      width: 28, height: 28, background: "var(--bg-secondary)", borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 600, fontSize: 12, color: "var(--text-muted)", flexShrink: 0,
                    }}>{letter}</div>
                    <input type="text" className="form-control"
                      value={form.options[i]} onChange={(e) => setOption(i, e.target.value)}
                      placeholder={`Option ${letter}`} required />
                  </div>
                ))}
              </div>
            )}

            {/* Correct Answer */}
            <div className="form-row form-row-2">
              <div className="form-group">
                <label className="form-label">Correct Answer *</label>
                {form.type === "trueFalse" ? (
                  <select className="form-control" value={form.correctAnswer}
                    onChange={(e) => setField("correctAnswer", e.target.value)} required>
                    <option value="">Select…</option>
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                ) : form.type === "mcq" ? (
                  <select className="form-control" value={form.correctAnswer}
                    onChange={(e) => setField("correctAnswer", e.target.value)} required>
                    <option value="">Select…</option>
                    {["A","B","C","D"].map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                ) : (
                  <input type={form.type === "numerical" ? "number" : "text"}
                    className="form-control"
                    value={form.correctAnswer}
                    onChange={(e) => setField("correctAnswer", e.target.value)}
                    placeholder={
                      form.type === "numerical" ? "e.g. 42" :
                      form.type === "formula"   ? "e.g. x = 5" :
                      "Expected answer…"
                    }
                    required />
                )}
                {form.type === "formula" && (
                  <p className="form-hint">Student must type exactly this (case-insensitive, trimmed).</p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Marks *</label>
                <input type="number" className="form-control"
                  value={form.marks} onChange={(e) => setField("marks", e.target.value)}
                  min="1" max={totalMarks || 100} required />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving…" : initial ? "Save Changes" : "Add Question"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ExamQuestions() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [exam,      setExam]      = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [actLoad,   setActLoad]   = useState(false);
  const [modal,     setModal]     = useState(null); // "add" | "edit"
  const [selected,  setSelected]  = useState(null);
  const [message,   setMessage]   = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [e, q] = await Promise.all([getExamById(id), getQuestions(id)]);
      setExam(e); setQuestions(q);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const showMsg = (type, text) => {
    setMessage({ type, text }); setTimeout(() => setMessage(null), 4000);
  };

  const totalAssigned = questions.reduce((s, q) => s + q.marks, 0);

  const handleAdd = async (data) => {
    setActLoad(true);
    try {
      await addQuestion(id, { ...data, order: questions.length });
      showMsg("success", "Question added.");
      setModal(null); await load();
    } catch (e) { showMsg("error", e.message); }
    finally { setActLoad(false); }
  };

  const handleEdit = async (data) => {
    setActLoad(true);
    try {
      await updateQuestion(id, selected.id, data);
      showMsg("success", "Question updated.");
      setModal(null); await load();
    } catch (e) { showMsg("error", e.message); }
    finally { setActLoad(false); }
  };

  const handleDelete = async (qId) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await deleteQuestion(id, qId);
      showMsg("success", "Question deleted.");
      await load();
    } catch (e) { showMsg("error", e.message); }
  };

  const qTypeBadge = (type) => {
    const colors = {
      mcq: "badge-primary", trueFalse: "badge-success",
      shortAnswer: "badge-neutral", numerical: "badge-warning", formula: "badge-neutral",
    };
    return <span className={`badge ${colors[type] || "badge-neutral"}`}>{qTypeLabel(type)}</span>;
  };

  if (loading) return <div className="loading-center"><div className="spinner spinner-lg" /></div>;

  return (
    <div>
      <div style={{ marginBottom: 6 }}>
        <button className="btn btn-ghost btn-sm" style={{ color: "var(--text-muted)" }}
          onClick={() => navigate(`/exams/${id}`)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={ARROW} /></svg>
          Back to {exam?.title || "Exam"}
        </button>
      </div>

      <div className="page-header">
        <div>
          <h1>Questions</h1>
          <p style={{ fontSize: 13, marginTop: 3 }}>
            {questions.length} question{questions.length !== 1 ? "s" : ""} &middot; {totalAssigned}/{exam?.totalMarks || "?"} marks assigned
            {totalAssigned !== exam?.totalMarks && (
              <span style={{ color: "var(--warning-text)", marginLeft: 6 }}>
                ⚠ {totalAssigned > (exam?.totalMarks || 0) ? "Over by" : "Under by"} {Math.abs(totalAssigned - (exam?.totalMarks || 0))} marks
              </span>
            )}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal("add")}>
          <Ico d={PLUS} /> Add Question
        </button>
      </div>

      {message && (
        <div className={`alert alert-${message.type === "success" ? "success" : "error"}`}
          style={{ marginBottom: 16 }}>{message.text}</div>
      )}

      {/* Marks progress bar */}
      {exam && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
            <span>Marks assigned</span>
            <span>{totalAssigned} / {exam.totalMarks}</span>
          </div>
          <div style={{ height: 6, background: "var(--bg-secondary)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 3,
              width: `${Math.min((totalAssigned / (exam.totalMarks || 1)) * 100, 100)}%`,
              background: totalAssigned === exam.totalMarks ? "var(--success)" :
                          totalAssigned  > exam.totalMarks  ? "var(--danger)"  : "var(--primary)",
              transition: "width 0.3s ease",
            }} />
          </div>
        </div>
      )}

      {questions.length === 0 ? (
        <div className="empty-state card" style={{ padding: 60 }}>
          <div className="empty-icon">📝</div>
          <h3>No questions yet</h3>
          <p>Add MCQ, True/False, Short Answer, Numerical, or Formula questions.</p>
          <button className="btn btn-primary" onClick={() => setModal("add")}>Add First Question</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {questions.map((q, i) => (
            <div key={q.id} className="card" style={{ padding: "14px 18px" }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                {/* Question number */}
                <div style={{
                  width: 32, height: 32, background: "var(--primary)", color: "#fff",
                  borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 13, flexShrink: 0,
                }}>{i + 1}</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6, alignItems: "center" }}>
                    {qTypeBadge(q.type)}
                    <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>
                      {q.marks} mark{q.marks !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: "var(--text-primary)", lineHeight: 1.5, fontWeight: 500 }}>
                    {q.text}
                  </p>
                  {q.type === "mcq" && q.options && (
                    <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                      {["A","B","C","D"].map((l, idx) => (
                        <div key={l} style={{
                          fontSize: 12, padding: "3px 8px", borderRadius: 4,
                          background: q.correctAnswer === l ? "var(--success-bg)" : "var(--bg-secondary)",
                          color: q.correctAnswer === l ? "var(--success-text)" : "var(--text-secondary)",
                          border: `1px solid ${q.correctAnswer === l ? "var(--success-border)" : "var(--border)"}`,
                          fontWeight: q.correctAnswer === l ? 600 : 400,
                        }}>
                          <strong>{l}.</strong> {q.options[idx]}
                          {q.correctAnswer === l && " ✓"}
                        </div>
                      ))}
                    </div>
                  )}
                  {q.type !== "mcq" && (
                    <div style={{ marginTop: 6, fontSize: 12, color: "var(--success-text)", fontWeight: 500 }}>
                      ✓ Correct: {q.correctAnswer}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button className="btn btn-ghost btn-icon btn-sm"
                    onClick={() => { setSelected(q); setModal("edit"); }}>
                    <Ico d={EDIT} size={14} />
                  </button>
                  <button className="btn btn-ghost btn-icon btn-sm"
                    style={{ color: "var(--danger)" }}
                    onClick={() => handleDelete(q.id)}>
                    <Ico d={TRASH} size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Done button */}
      {questions.length > 0 && (
        <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setModal("add")}>
            <Ico d={PLUS} /> Add Another
          </button>
          <button className="btn btn-primary" onClick={() => navigate(`/exams/${id}`)}>
            Done — View Exam →
          </button>
        </div>
      )}

      {/* Modals */}
      {modal === "add" && (
        <QuestionForm totalMarks={exam?.totalMarks}
          onSave={handleAdd} onCancel={() => setModal(null)} loading={actLoad} />
      )}
      {modal === "edit" && selected && (
        <QuestionForm initial={selected} totalMarks={exam?.totalMarks}
          onSave={handleEdit} onCancel={() => setModal(null)} loading={actLoad} />
      )}
    </div>
  );
}
