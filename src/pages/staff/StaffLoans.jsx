import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import RejectAction from "../../components/RejectAction";
import { api, ApiError } from "../../api/client";
import { formatCents } from "../../utils/money";

export default function StaffLoans() {
  const [applications, setApplications] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      const data = await api.staffListLoanApplications();
      setApplications(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load applications.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id) {
    setError("");
    try {
      await api.staffApproveLoan(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not approve this application.");
    }
  }

  async function reject(id, reason) {
    setError("");
    try {
      await api.staffRejectLoan(id, reason);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reject this application.");
    }
  }

  return (
    <AdminLayout>
      <div className="page-header">
        <h1>Loans</h1>
      </div>

      {error && <div className="form-error">{error}</div>}

      {applications === null ? (
        <p>Loading…</p>
      ) : applications.length === 0 ? (
        <div className="empty-state">No applications yet.</div>
      ) : (
        <div className="ledger">
          {applications.map((a) => (
            <div className="ledger-row" key={a.id} style={{ flexDirection: "column", alignItems: "stretch" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div className="ledger-desc">
                    {a.applicant_email} — {a.product.name}, <span className="money">{formatCents(a.requested_amount_cents)}</span> over{" "}
                    {a.term_months} months
                  </div>
                  {a.purpose && <div className="ledger-meta">{a.purpose}</div>}
                  <div className="ledger-meta">
                    {new Date(a.created_at).toLocaleString()}
                    <span className={`status-pill ${a.status}`}>{a.status.replace("_", " ")}</span>
                  </div>
                </div>
                {a.status === "submitted" && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn-gold" onClick={() => approve(a.id)}>
                      Approve
                    </button>
                    <RejectAction onReject={(reason) => reject(a.id, reason)} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
