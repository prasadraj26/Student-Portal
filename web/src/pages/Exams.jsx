import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getExams, publishExam, closeExam, archiveExam, deleteExam } from "../services/examService";

const PLUS = [<line key="v" x1="12" y1="5" x2="12" y2="19"/>, <line key="h" x1="5" y1="12" x2="19" y2="12"/>];
const ARROW = <polyline points="9 18 15 12 9 6" />;

const Ico = ({ d, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {typeof d === "string" ? <path d={d} /> : d}
  </svg>
);

function StatusBadge({ status }) {
  const map = {
    draft:     { cls: "badge-warning", label: "Draft"     },
    published: { cls: "badge-success", label: "Published" },
    closed:    { cls: "badge-danger",  label: "Closed"    },
    archived:  { cls: "badge-neutral", label: "Archived"  },
  };
  const { cls, label } = map[status] || { cls: "badge-neutral", label: status };
  return <span className={`badge ${cls}`}>{label}</span>;
}

export default function Exams() {
  const navigate = useNavigate();
  const [exams, setExams]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");
  const [search, setSearch]     = useState("");
  const [message, setMessage]   = useState(null);

  const load = async () => {
    setLoading(true);
    try { setExams(await getExams()); }
    catch (e) { showMsg("error", e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const filtered = exams.filter((e) => {
    const matchFilter = filter === "all" || e.status === filter;
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const handlePublish = async (id) => {
    try { await publishExam(id); showMsg("success", "Exam published."); await load(); }
    catch (e) { showMsg("error", e.message); }
  };
  const handleClose = async (id) => {
    try { await closeExam(id); showMsg("success", "Exam closed."); await load(); }
    catch (e) { showMsg("error", e.message); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this draft exam? This cannot be undone.")) return;
    try { await deleteExam(id); showMsg("success", "Exam deleted."); await load(); }
    catch (e) { showMsg("error", e.message); }
  };

  const counts = {
    all:       exams.length,
    draft:     exams.filter((e) => e.status === "draft").length,
    published: exams.filter((e) => e.status === "published").length,
    closed:    exams.filter((e) => e.status === "closed").length,
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Exams</h1>
          <p style={{ fontSize: 13, marginTop: 3 }}>
            {counts.published} published &middot; {counts.draft} drafts &middot; {counts.closed} closed
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate("/exams/create")}>
          <Ico d={PLUS} /> Create Exam
        </button>
      </div>

      {message && (
        <div className={`alert alert-${message.type === "success" ? "success" : "error"}`}
          style={{ marginBottom: 16 }}>{message.text}</div>
      )}

      {/* Tabs + Search */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
        <div className="tabs" style={{ marginBottom: 0, border: "none", gap: 4 }}>
          {["all", "draft", "published", "closed"].map((tab) => (
            <button key={tab} className={`tab-btn ${filter === tab ? "active" : ""}`}
              onClick={() => setFilter(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span style={{ marginLeft: 5, background: "var(--bg-secondary)", borderRadius: 10, padding: "0 6px", fontSize: 11, fontWeight: 600 }}>
                {counts[tab] ?? 0}
              </span>
            </button>
          ))}
        </div>
        <div className="search-wrapper" style={{ maxWidth: 280 }}>
          <span className="search-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input type="text" className="form-control" placeholder="Search exams…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner spinner-lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state card" style={{ padding: 60 }}>
          <div className="empty-icon">📝</div>
          <h3>No exams found</h3>
          <p>{filter !== "all" ? `No ${filter} exams.` : "Create your first exam to get started."}</p>
          <button className="btn btn-primary" onClick={() => navigate("/exams/create")}>
            Create Exam
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((exam) => (
            <div key={exam.id} className="card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
              {/* Color strip */}
              <div style={{
                width: 4, height: 48, borderRadius: 2, flexShrink: 0,
                background:
                  exam.status === "published" ? "var(--success)" :
                  exam.status === "draft"     ? "var(--warning)"  :
                  exam.status === "closed"    ? "var(--danger)"   : "var(--border)",
              }} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <strong style={{ fontSize: 15, color: "var(--text-primary)" }}>{exam.title}</strong>
                  <StatusBadge status={exam.status} />
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 4, flexWrap: "wrap" }}>
                  {exam.className && <span className="text-muted" style={{ fontSize: 12 }}>🏫 {exam.className}</span>}
                  {exam.subjectName && <span className="text-muted" style={{ fontSize: 12 }}>📚 {exam.subjectName}</span>}
                  <span className="text-muted" style={{ fontSize: 12 }}>⏱ {exam.durationMinutes} min</span>
                  <span className="text-muted" style={{ fontSize: 12 }}>📊 {exam.totalMarks} marks</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/exams/${exam.id}`)}>
                  View <Ico d={ARROW} />
                </button>
                {exam.status === "draft" && (
                  <>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/exams/${exam.id}/edit`)}>Edit</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/exams/${exam.id}/questions`)}>Questions</button>
                    <button className="btn btn-success btn-sm" onClick={() => handlePublish(exam.id)}>Publish</button>
                    <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => handleDelete(exam.id)}>Delete</button>
                  </>
                )}
                {exam.status === "published" && (
                  <>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/exams/${exam.id}/questions`)}>Questions</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleClose(exam.id)}>Close</button>
                  </>
                )}
                {exam.status === "closed" && (
                  <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/results/${exam.id}`)}>Results</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
