import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { api, ApiError } from "../../api/client";

export default function StaffAuditLog() {
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .staffListAuditLog()
      .then(setLogs)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load the audit log."));
  }, []);

  return (
    <AdminLayout>
      <div className="page-header">
        <h1>Audit Log</h1>
      </div>

      {error && <div className="form-error">{error}</div>}

      {logs === null ? (
        <p>Loading…</p>
      ) : logs.length === 0 ? (
        <div className="empty-state">No activity recorded yet.</div>
      ) : (
        <div className="ledger">
          {logs.map((l) => (
            <div className="ledger-row" key={l.id}>
              <div>
                <div className="ledger-desc">{l.action}</div>
                <div className="ledger-meta">
                  {l.actor_email || "system"} → {l.target_type}:{l.target_id.slice(0, 8)}
                  {l.reason && ` — ${l.reason}`}
                </div>
                <div className="ledger-meta">{new Date(l.created_at).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
