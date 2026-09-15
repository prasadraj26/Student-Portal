import { useEffect, useState } from "react";
import {
  getSubjects, addSubject, updateSubject,
  deactivateSubject, reactivateSubject,
} from "../services/subjectService";

const CLOSE = [<line key="1" x1="18" y1="6" x2="6" y2="18"/>, <line key="2" x1="6" y1="6" x2="18" y2="18"/>];
const PLUS  = [<line key="v" x1="12" y1="5" x2="12" y2="19"/>, <line key="h" x1="5" y1="12" x2="19" y2="12"/>];

const Ico = ({ d, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {typeof d === "string" ? <path d={d} /> : d}
  </svg>
);

function SubjectModal({ mode, subject, onSave, onClose, loading }) {
  const [name, setName] = useState(subject?.name || "");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Subject name is required."); return; }
    try { await onSave({ name }); }
    catch (err) { setError(err.message); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h3>{mode === "edit" ? "Edit Subject" : "Add New Subject"}</h3>
          <button className="modal-close" onClick={onClose}><Ico d={CLOSE} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">Subject Name *</label>
              <input type="text" className="form-control"
                value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mathematics, Physics, English" required />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving…" : mode === "edit" ? "Save Changes" : "Add Subject"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [actLoad,  setActLoad]  = useState(false);
  const [message,  setMessage]  = useState(null);
  const [modal,    setModal]    = useState(null);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    try { setSubjects(await getSubjects()); }
    catch (e) { showMsg("error", e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleAdd = async ({ name }) => {
    setActLoad(true);
    try {
      await addSubject({ name });
      showMsg("success", `${name} added.`);
      setModal(null);
      await load();
    } finally { setActLoad(false); }
  };

  const handleEdit = async ({ name }) => {
    setActLoad(true);
    try {
      await updateSubject(selected.id, { name });
      showMsg("success", "Subject updated.");
      setModal(null);
      await load();
    } finally { setActLoad(false); }
  };

  const handleToggle = async (sub) => {
    try {
      if (sub.active) await deactivateSubject(sub.id);
      else await reactivateSubject(sub.id);
      await load();
    } catch (e) { showMsg("error", e.message); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Subjects</h1>
          <p style={{ fontSize: 13, marginTop: 3 }}>
            {subjects.filter((s) => s.active).length} active &middot; {subjects.length} total
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal("add")}>
          <Ico d={PLUS} /> Add Subject
        </button>
      </div>

      {message && (
        <div className={`alert alert-${message.type === "success" ? "success" : "error"}`}
          style={{ marginBottom: 16 }}>{message.text}</div>
      )}

      {loading ? (
        <div className="loading-center"><div className="spinner spinner-lg" /></div>
      ) : subjects.length === 0 ? (
        <div className="empty-state card" style={{ padding: 60 }}>
          <div className="empty-icon">📚</div>
          <h3>No subjects yet</h3>
          <p>Add subjects like Mathematics, Physics, English, etc.</p>
          <button className="btn btn-primary" onClick={() => setModal("add")}>Add Subject</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {subjects.map((s) => (
            <div key={s.id} className="card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: "var(--radius)",
                background: "var(--bg-secondary)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, flexShrink: 0,
              }}>📖</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{s.name}</div>
                <span className={`badge ${s.active ? "badge-success" : "badge-danger"}`} style={{ marginTop: 4 }}>
                  {s.active ? "Active" : "Inactive"}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                <button className="btn btn-ghost btn-sm"
                  onClick={() => { setSelected(s); setModal("edit"); }}>Edit</button>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: s.active ? "var(--danger)" : "var(--success-text)", fontSize: 11 }}
                  onClick={() => handleToggle(s)}
                >
                  {s.active ? "Disable" : "Enable"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal === "add" && (
        <SubjectModal mode="add" onSave={handleAdd} onClose={() => setModal(null)} loading={actLoad} />
      )}
      {modal === "edit" && selected && (
        <SubjectModal mode="edit" subject={selected} onSave={handleEdit} onClose={() => setModal(null)} loading={actLoad} />
      )}
    </div>
  );
}
