import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import RejectAction from "../../components/RejectAction";
import { api, ApiError } from "../../api/client";
import { formatSignedCents, formatCents } from "../../utils/money";
import { transactionDateLabel } from "../../utils/dates";

export default function StaffTransactions() {
  const [adjustments, setAdjustments] = useState(null);
  const [withdrawals, setWithdrawals] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      const [adj, wd] = await Promise.all([api.staffListAdjustments(), api.staffListWithdrawals()]);
      setAdjustments(adj);
      setWithdrawals(wd);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load the queue.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function approveAdjustment(id) {
    setError("");
    try {
      await api.staffApproveAdjustment(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not approve this adjustment.");
    }
  }

  async function rejectAdjustment(id, reason) {
    setError("");
    try {
      await api.staffRejectAdjustment(id, reason);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reject this adjustment.");
    }
  }

  async function approveWithdrawal(id) {
    setError("");
    try {
      await api.staffApproveWithdrawal(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not approve this withdrawal.");
    }
  }

  async function rejectWithdrawal(id, reason) {
    setError("");
    try {
      await api.staffRejectWithdrawal(id, reason);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reject this withdrawal.");
    }
  }

  const pendingAdjustments = adjustments?.filter((a) => a.status === "pending_approval") ?? [];
  const decidedAdjustments = adjustments?.filter((a) => a.status !== "pending_approval") ?? [];

  return (
    <AdminLayout>
      <div className="page-header">
        <h1>Transactions</h1>
      </div>

      {error && <div className="form-error">{error}</div>}

      <h2 style={{ fontSize: "1.2rem", marginBottom: 14 }}>Pending manual adjustments</h2>
      {adjustments === null ? (
        <p>Loading…</p>
      ) : pendingAdjustments.length === 0 ? (
        <div className="empty-state" style={{ marginBottom: 32 }}>Nothing pending.</div>
      ) : (
        <div className="ledger" style={{ marginBottom: 32 }}>
          {pendingAdjustments.map((a) => (
            <div className="ledger-row" key={a.id} style={{ flexDirection: "column", alignItems: "stretch" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div className="ledger-desc">
                    {a.account_name} ({a.account_owner_email}) —{" "}
                    <span className="money">{formatSignedCents(a.amount_cents)}</span>
                  </div>
                  <div className="ledger-meta">
                    {a.reason} · requested by {a.requested_by_email}
                  </div>
                  <div className="ledger-meta">{transactionDateLabel(a)}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-gold" onClick={() => approveAdjustment(a.id)}>
                    Approve
                  </button>
                  <RejectAction onReject={(reason) => rejectAdjustment(a.id, reason)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ fontSize: "1.2rem", marginBottom: 14 }}>Pending withdrawals</h2>
      {withdrawals === null ? (
        <p>Loading…</p>
      ) : withdrawals.length === 0 ? (
        <div className="empty-state" style={{ marginBottom: 32 }}>Nothing pending.</div>
      ) : (
        <div className="ledger" style={{ marginBottom: 32 }}>
          {withdrawals.map((w) => (
            <div className="ledger-row" key={w.id} style={{ flexDirection: "column", alignItems: "stretch" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div className="ledger-desc">
                    {w.account_name} ({w.account_owner_email}) —{" "}
                    <span className="money">{formatCents(w.amount_cents)}</span>
                  </div>
                  <div className="ledger-meta">
                    To •••• {w.destination_account_number.slice(-4)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-gold" onClick={() => approveWithdrawal(w.id)}>
                    Approve
                  </button>
                  <RejectAction onReject={(reason) => rejectWithdrawal(w.id, reason)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {decidedAdjustments.length > 0 && (
        <>
          <h2 style={{ fontSize: "1.2rem", marginBottom: 14 }}>Recent adjustments</h2>
          <div className="ledger">
            {decidedAdjustments.slice(0, 20).map((a) => (
              <div className="ledger-row" key={a.id}>
                <div>
                  <div className="ledger-desc">
                    {a.account_name} ({a.account_owner_email}) —{" "}
                    <span className="money">{formatSignedCents(a.amount_cents)}</span>
                  </div>
                  <div className="ledger-meta">
                    {a.reason}
                    <span className={`status-pill ${a.status}`}>{a.status.replace("_", " ")}</span>
                  </div>
                  <div className="ledger-meta">{transactionDateLabel(a)}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
