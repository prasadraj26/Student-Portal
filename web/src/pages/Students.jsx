import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  getStudents, addStudent, updateStudent,
  deactivateStudent, reactivateStudent,
} from "../services/studentService";
import { getActiveClasses } from "../services/classService";

/* ── Tiny inline icon ── */
const Ico = ({ d, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {typeof d === "string" ? <path d={d} /> : d}
  </svg>
);

const SEARCH_D = "M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0";
const PLUS_D   = [<line key="v" x1="12" y1="5" x2="12" y2="19"/>, <line key="h" x1="5" y1="12" x2="19" y2="12"/>];
const EDIT_D   = "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7";
const EDIT2_D  = "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z";
const CLOSE_D  = [<line key="1" x1="18" y1="6" x2="6" y2="18"/>, <line key="2" x1="6" y1="6" x2="18" y2="18"/>];

/* ── Status Badge ── */
function StatusBadge({ active }) {
  return (
    <span className={`badge ${active ? "badge-success" : "badge-danger"}`}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

/* ── Confirm Deactivate Modal ── */
function ConfirmModal({ student, onConfirm, onCancel, loading }) {
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h3>Confirm Deactivation</h3>
          <button className="modal-close" onClick={onCancel}><Ico d={CLOSE_D} /></button>
        </div>
        <div className="modal-body">
          <div className="alert alert-warning">
            This will deactivate <strong>{student.name}</strong> ({student.studentId}).
            Their exam history will be preserved. You can reactivate them later.
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? <><span className="spinner" style={{ width: 13, height: 13, borderTopColor: "#fff", borderColor: "rgba(255,255,255,0.3)" }} />Deactivating…</> : "Deactivate"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Add / Edit Modal ── */
function StudentModal({ mode, student, classes, onSave, onClose, loading }) {
  const isEdit = mode === "edit";
  const [name, setName]           = useState(student?.name || "");
  const [classId, setClassId]     = useState(student?.classId || classes[0]?.id || "");
  const [rollNumber, setRollNumber] = useState(student?.rollNumber || "");
  const [error, setError]         = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim())    { setError("Name is required."); return; }
    if (!classId)        { setError("Please select a class."); return; }
    if (!isEdit && !rollNumber) { setError("Roll number is required."); return; }
    try {
      await onSave({ name, classId, rollNumber: Number(rollNumber) });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>{isEdit ? "Edit Student" : "Add New Student"}</h3>
          <button className="modal-close" onClick={onClose}><Ico d={CLOSE_D} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text" className="form-control"
                value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Arjun Sharma" required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Class *</label>
              <select className="form-control" value={classId}
                onChange={(e) => setClassId(e.target.value)} required>
                <option value="">Select class…</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name || `${c.grade}${c.section}`}</option>
                ))}
              </select>
              {classes.length === 0 && (
                <p className="form-hint">No classes found. <a href="/classes">Add a class first.</a></p>
              )}
            </div>

            {!isEdit && (
              <div className="form-group">
                <label className="form-label">Roll Number *</label>
                <input
                  type="number" className="form-control"
                  value={rollNumber} onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="01" min="1" max="99" required
                />
                <p className="form-hint">
                  Student ID will be auto-generated: {classId}{rollNumber ? String(rollNumber).padStart(2, "0") : "__"}
                </p>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" style={{ width: 13, height: 13, borderTopColor: "#fff", borderColor: "rgba(255,255,255,0.3)" }} />{isEdit ? "Saving…" : "Adding…"}</> : isEdit ? "Save Changes" : "Add Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function Students() {
  const navigate = useNavigate();
  const [students, setStudents]         = useState([]);
  const [classes, setClasses]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage]           = useState(null); // { type, text }

  const [search, setSearch]             = useState("");
  const [filterClass, setFilterClass]   = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [modal, setModal]               = useState(null); // "add" | "edit" | "deactivate"
  const [selected, setSelected]         = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([getStudents(), getActiveClasses()]);
      setStudents(s);
      setClasses(c);
    } catch (e) {
      showMsg("error", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  /* Client-side filter */
  const filtered = useMemo(() => {
    return students.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch = !q || s.name.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q);
      const matchClass  = !filterClass || s.classId === filterClass;
      const matchStatus =
        filterStatus === "all"      ? true :
        filterStatus === "active"   ? s.active :
        !s.active;
      return matchSearch && matchClass && matchStatus;
    });
  }, [students, search, filterClass, filterStatus]);

  /* Add student */
  const handleAdd = async ({ name, classId, rollNumber }) => {
    setActionLoading(true);
    try {
      const id = await addStudent({ name, classId, rollNumber });
      showMsg("success", `Student ${id} added successfully.`);
      setModal(null);
      await load();
    } finally {
      setActionLoading(false);
    }
  };

  /* Edit student */
  const handleEdit = async ({ name, classId }) => {
    setActionLoading(true);
    try {
      await updateStudent(selected.id, { name, classId });
      showMsg("success", "Student updated.");
      setModal(null);
      await load();
    } finally {
      setActionLoading(false);
    }
  };

  /* Deactivate */
  const handleDeactivate = async () => {
    setActionLoading(true);
    try {
      await deactivateStudent(selected.id);
      showMsg("success", `${selected.name} deactivated.`);
      setModal(null);
      await load();
    } finally {
      setActionLoading(false);
    }
  };

  /* Reactivate */
  const handleReactivate = async (student) => {
    try {
      await reactivateStudent(student.id);
      showMsg("success", `${student.name} reactivated.`);
      await load();
    } catch (e) {
      showMsg("error", e.message);
    }
  };

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1>Students</h1>
          <p style={{ marginTop: 3, fontSize: 13 }}>
            {students.filter((s) => s.active).length} active &middot; {students.length} total
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal("add")}>
          <Ico d={PLUS_D} /> Add Student
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`alert alert-${message.type === "success" ? "success" : "error"}`}
          style={{ marginBottom: 16 }}>
          {message.text}
        </div>
      )}

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="search-wrapper">
          <span className="search-icon"><Ico d={SEARCH_D} size={15} /></span>
          <input
            type="text" className="form-control"
            placeholder="Search by name or student ID…"
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-control filter-select"
          value={filterClass} onChange={(e) => setFilterClass(e.target.value)}
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name || `${c.grade}${c.section}`}</option>
          ))}
        </select>
        <select
          className="form-control filter-select"
          value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-center"><div className="spinner spinner-lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state card" style={{ padding: 60 }}>
          <div className="empty-icon">👥</div>
          <h3>{search || filterClass || filterStatus !== "all" ? "No matching students" : "No students yet"}</h3>
          <p>{search ? "Try a different search term." : "Add your first student to get started."}</p>
          {!search && <button className="btn btn-primary" onClick={() => setModal("add")}>Add Student</button>}
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Class</th>
                <th>Roll No.</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>
                    <code style={{ fontSize: 12, background: "var(--bg-secondary)", padding: "2px 6px", borderRadius: 4 }}>
                      {s.studentId}
                    </code>
                  </td>
                  <td><strong>{s.name}</strong></td>
                  <td>{s.classId}</td>
                  <td className="text-muted">{String(s.rollNumber).padStart(2, "0")}</td>
                  <td><StatusBadge active={s.active} /></td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn btn-ghost btn-sm"
                        title="Edit"
                        onClick={() => { setSelected(s); setModal("edit"); }}
                      >
                        <Ico d={[<path key="1" d={EDIT_D} />, <path key="2" d={EDIT2_D} />]} />
                      </button>
                      {s.active ? (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: "var(--danger)" }}
                          title="Deactivate"
                          onClick={() => { setSelected(s); setModal("deactivate"); }}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: "var(--success-text)" }}
                          title="Reactivate"
                          onClick={() => handleReactivate(s)}
                        >
                          Reactivate
                        </button>
                      )}
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => navigate(`/reports/student/${s.id}`)}
                        title="View Report"
                      >
                        Report
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {modal === "add" && (
        <StudentModal
          mode="add" classes={classes}
          onSave={handleAdd} onClose={() => setModal(null)} loading={actionLoading}
        />
      )}
      {modal === "edit" && selected && (
        <StudentModal
          mode="edit" student={selected} classes={classes}
          onSave={handleEdit} onClose={() => setModal(null)} loading={actionLoading}
        />
      )}
      {modal === "deactivate" && selected && (
        <ConfirmModal
          student={selected}
          onConfirm={handleDeactivate} onCancel={() => setModal(null)} loading={actionLoading}
        />
      )}
    </div>
  );
}