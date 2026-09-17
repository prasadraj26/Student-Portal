import { useEffect, useState } from "react";
import {
  getClasses, addClass, updateClass,
  deactivateClass, reactivateClass,
} from "../services/classService";
import { getStudents } from "../services/studentService";

const CLOSE = [<line key="1" x1="18" y1="6" x2="6" y2="18"/>, <line key="2" x1="6" y1="6" x2="18" y2="18"/>];
const PLUS  = [<line key="v" x1="12" y1="5" x2="12" y2="19"/>, <line key="h" x1="5" y1="12" x2="19" y2="12"/>];

const Ico = ({ d, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {typeof d === "string" ? <path d={d} /> : d}
  </svg>
);

/* Modal */
function ClassModal({ mode, cls, onSave, onClose, loading }) {
  const [grade,   setGrade]   = useState(cls?.grade   || "");
  const [section, setSection] = useState(cls?.section || "");
  const [error,   setError]   = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!grade.trim())   { setError("Grade is required.");   return; }
    if (!section.trim()) { setError("Section is required."); return; }
    // name and classId are derived inside classService — only pass grade/section
    try { await onSave({ grade: grade.trim(), section: section.trim() }); }
    catch (err) { setError(err.message); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>{mode === "edit" ? "Edit Class" : "Add New Class"}</h3>
          <button className="modal-close" onClick={onClose}><Ico d={CLOSE} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-row form-row-2">
              <div className="form-group">
                <label className="form-label">Grade *</label>
                <input type="text" className="form-control"
                  value={grade} onChange={(e) => setGrade(e.target.value)}
                  placeholder="e.g. 10" required />
              </div>
              <div className="form-group">
                <label className="form-label">Section *</label>
                <input type="text" className="form-control"
                  value={section} onChange={(e) => setSection(e.target.value)}
                  placeholder="e.g. A" maxLength={3} required />
              </div>
            </div>
            <p className="form-hint">
              Class ID used for Student ID generation: {grade}{section ? section.toUpperCase() : "__"}
            </p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving…" : mode === "edit" ? "Save Changes" : "Add Class"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Classes() {
  const [classes,  setClasses]  = useState([]);
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [actLoad,  setActLoad]  = useState(false);
  const [message,  setMessage]  = useState(null);
  const [modal,    setModal]    = useState(null); // "add" | "edit"
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([getClasses(), getStudents()]);
      setClasses(c);
      setStudents(s);
    } catch (e) { showMsg("error", e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // Compare against c.classId (the deterministic "10A"-style ID), not c.id
  const studentCount = (classId) =>
    students.filter((s) => s.classId === classId && s.active).length;

  const handleAdd = async (data) => {
    setActLoad(true);
    try {
      await addClass(data);
      showMsg("success", `Class ${data.name} added.`);
      setModal(null);
      await load();
    } finally { setActLoad(false); }
  };

  const handleEdit = async (data) => {
    setActLoad(true);
    try {
      // Use selected.classId (deterministic "10A"-style), not selected.id (Firestore doc ID)
      await updateClass(selected.classId, data);
      showMsg("success", "Class updated.");
      setModal(null);
      await load();
    } finally { setActLoad(false); }
  };

  const handleToggle = async (cls) => {
    try {
      // Use cls.classId (deterministic "10A"-style), not cls.id (Firestore doc ID)
      if (cls.active) await deactivateClass(cls.classId);
      else await reactivateClass(cls.classId);
      showMsg("success", cls.active ? `${cls.name} deactivated.` : `${cls.name} reactivated.`);
      await load();
    } catch (e) { showMsg("error", e.message); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Classes</h1>
          <p style={{ fontSize: 13, marginTop: 3 }}>Manage grade/section classes assigned to students.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal("add")}>
          <Ico d={PLUS} /> Add Class
        </button>
      </div>

      {message && (
        <div className={`alert alert-${message.type === "success" ? "success" : "error"}`}
          style={{ marginBottom: 16 }}>{message.text}</div>
      )}

      {loading ? (
        <div className="loading-center"><div className="spinner spinner-lg" /></div>
      ) : classes.length === 0 ? (
        <div className="empty-state card" style={{ padding: 60 }}>
          <div className="empty-icon">🏫</div>
          <h3>No classes yet</h3>
          <p>Add your first class to start managing students.</p>
          <button className="btn btn-primary" onClick={() => setModal("add")}>Add Class</button>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Class Name</th>
                <th>Grade</th>
                <th>Section</th>
                <th>Active Students</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.name || `Grade ${c.grade} – ${c.section}`}</strong></td>
                  <td>{c.grade}</td>
                  <td>{c.section}</td>
                  <td>
                    <span style={{ fontWeight: 600, color: "var(--primary)" }}>
                      {studentCount(c.classId)}
                    </span>
                    <span className="text-muted" style={{ fontSize: 11 }}> students</span>
                  </td>
                  <td>
                    <span className={`badge ${c.active ? "badge-success" : "badge-danger"}`}>
                      {c.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-ghost btn-sm"
                        onClick={() => { setSelected(c); setModal("edit"); }}>Edit</button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: c.active ? "var(--danger)" : "var(--success-text)" }}
                        onClick={() => handleToggle(c)}
                      >
                        {c.active ? "Deactivate" : "Reactivate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal === "add" && (
        <ClassModal mode="add" onSave={handleAdd} onClose={() => setModal(null)} loading={actLoad} />
      )}
      {modal === "edit" && selected && (
        <ClassModal mode="edit" cls={selected} onSave={handleEdit} onClose={() => setModal(null)} loading={actLoad} />
      )}
    </div>
  );
}
