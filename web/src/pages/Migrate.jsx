import { useState } from "react";
import { runMigration } from "../services/migrateService";

export default function Migrate() {
  const [running, setRunning] = useState(false);
  const [done,    setDone]    = useState(false);
  const [report,  setReport]  = useState(null);
  const [log,     setLog]     = useState([]);

  const handleRun = async () => {
    setRunning(true);
    setLog([]);
    setReport(null);
    try {
      const result = await runMigration((msg) =>
        setLog((prev) => [...prev, msg])
      );
      setReport(result);
      setDone(true);
    } catch (e) {
      setLog((prev) => [...prev, "FATAL ERROR: " + e.message]);
    } finally {
      setRunning(false);
    }
  };

  const pill = (ok, warn, bad, val, label) => {
    const color = val > 0
      ? (label === "migrated" ? "var(--success-text)"
       : label === "conflicts" || label === "errors" ? "var(--danger-text)"
       : "var(--text-primary)")
      : "var(--text-muted)";
    return (
      <div style={{ textAlign: "center", minWidth: 70 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color }}>{val}</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.3 }}>{label}</div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 780, margin: "0 auto" }}>
      <div className="page-header">
        <div>
          <h1>🛠 Data Migration</h1>
          <p style={{ fontSize: 13, marginTop: 3, color: "var(--text-muted)" }}>
            Creates canonical class/student documents (10A, 10A01) from legacy random-ID records.
            Safe — does <strong>not</strong> delete old records.
          </p>
        </div>
      </div>

      {!done && (
        <div className="card" style={{ marginBottom: 20, padding: 24 }}>
          <p style={{ fontSize: 14, marginBottom: 16, lineHeight: 1.7 }}>
            This will scan <code>classes</code> and <code>students</code> in Firestore.
            Legacy records (with random document IDs) will have canonical counterparts created.
            <br />
            Already-canonical records are left untouched. Conflicts are reported, not overwritten.
          </p>
          <button
            id="run-migration-btn"
            className="btn btn-primary"
            onClick={handleRun}
            disabled={running}
            style={{ minWidth: 180 }}
          >
            {running ? <><span className="spinner" style={{ width: 13, height: 13, borderTopColor: "#fff", borderColor: "rgba(255,255,255,0.3)", marginRight: 8 }} />Running…</> : "▶ Run Migration"}
          </button>
        </div>
      )}

      {/* Live log */}
      {log.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><h3>Migration Log</h3></div>
          <div style={{
            fontFamily: "monospace", fontSize: 12, padding: 16,
            background: "var(--bg-secondary)", maxHeight: 320, overflowY: "auto",
            lineHeight: 1.8, whiteSpace: "pre-wrap",
          }} id="migration-log">
            {log.map((l, i) => (
              <div key={i} style={{
                color: l.startsWith("  DONE") ? "var(--success-text)"
                     : l.startsWith("  ERR")  ? "var(--danger-text)"
                     : l.startsWith("  SKIP") ? "var(--warning-text)"
                     : "var(--text-primary)",
              }}>{l}</div>
            ))}
          </div>
        </div>
      )}

      {/* Report */}
      {report && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><h3>Classes</h3></div>
            <div className="card-body" style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              {pill(null,null,null, report.classes.found,           "found")}
              {pill(null,null,null, report.classes.alreadyCanonical,"already ok")}
              {pill(null,null,null, report.classes.legacy,          "legacy")}
              {pill(null,null,null, report.classes.migrated,        "migrated")}
              {pill(null,null,null, report.classes.conflicts,       "conflicts")}
              {pill(null,null,null, report.classes.errors.length,   "errors")}
            </div>
          </div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><h3>Students</h3></div>
            <div className="card-body" style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              {pill(null,null,null, report.students.found,           "found")}
              {pill(null,null,null, report.students.alreadyCanonical,"already ok")}
              {pill(null,null,null, report.students.legacy,          "legacy")}
              {pill(null,null,null, report.students.migrated,        "migrated")}
              {pill(null,null,null, report.students.conflicts,       "conflicts")}
              {pill(null,null,null, report.students.errors.length,   "errors")}
            </div>
          </div>

          {report.legacyRecords.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header"><h3>Legacy Records Detail</h3></div>
              <div className="table-container" style={{ border: "none" }}>
                <table className="table" id="migration-results-table">
                  <thead><tr><th>Collection</th><th>Old ID</th><th>New ID</th><th>Status</th></tr></thead>
                  <tbody>
                    {report.legacyRecords.map((r, i) => (
                      <tr key={i}>
                        <td><code style={{ fontSize: 11 }}>{r.collection}</code></td>
                        <td><code style={{ fontSize: 11, color: "var(--danger-text)" }}>{r.oldId}</code></td>
                        <td><code style={{ fontSize: 11, color: "var(--success-text)" }}>{r.newId}</code></td>
                        <td>
                          <span className={`badge ${r.status === "migrated" ? "badge-success" : r.status === "conflict" ? "badge-warning" : "badge-danger"}`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {report.legacyRecords.length === 0 && (
            <div className="alert alert-success" id="migration-clean">
              ✅ No legacy records found — all classes and students already use canonical IDs.
            </div>
          )}
        </>
      )}
    </div>
  );
}
