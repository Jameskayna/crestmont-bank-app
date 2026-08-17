import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import RejectAction from "../../components/RejectAction";
import { api, ApiError } from "../../api/client";
import { formatCents } from "../../utils/money";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function AdjustmentForm({ accountId, onDone }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState("credit");
  const [reason, setReason] = useState("");
  const [transactionDate, setTransactionDate] = useState(todayIsoDate());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!open) {
    return (
      <button className="btn-secondary" onClick={() => setOpen(true)}>
        Fund / Debit
      </button>
    );
  }

  const isBackdated = transactionDate !== todayIsoDate();

  async function submit(e) {
    e.preventDefault();
    setError("");
    const cents = Math.round(parseFloat(amount) * 100);
    if (!Number.isFinite(cents) || cents <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    setSubmitting(true);
    try {
      await api.staffCreateAdjustment({
        account: accountId,
        amount_cents: direction === "credit" ? cents : -cents,
        reason,
        // Only sent when it actually differs from today — an ordinary,
        // same-day adjustment doesn't need to carry a redundant date.
        ...(isBackdated ? { transaction_date: transactionDate } : {}),
      });
      setOpen(false);
      setAmount("");
      setReason("");
      setTransactionDate(todayIsoDate());
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not submit the adjustment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
      {error && <div className="form-error" style={{ width: "100%" }}>{error}</div>}
      <select value={direction} onChange={(e) => setDirection(e.target.value)}>
        <option value="credit">Credit</option>
        <option value="debit">Debit</option>
      </select>
      <input
        type="number"
        min="0.01"
        step="0.01"
        placeholder="Amount (USD)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        style={{ width: 130 }}
        required
      />
      <input
        type="text"
        placeholder="Reason (required)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        style={{ width: 220 }}
        required
      />
      <div>
        <label style={{ fontSize: "0.72rem", color: "var(--ink-muted)", display: "block", marginBottom: 2 }}>
          Transaction date
        </label>
        <input
          type="date"
          value={transactionDate}
          max={todayIsoDate()}
          onChange={(e) => setTransactionDate(e.target.value)}
        />
      </div>
      <button className="btn-gold" type="submit" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit"}
      </button>
      <button className="btn-link" type="button" onClick={() => setOpen(false)}>
        Cancel
      </button>
      {isBackdated && (
        <p className="field-hint" style={{ width: "100%", margin: 0 }}>
          This will be recorded as happening on {transactionDate}, not today — make sure the reason above explains
          why (e.g. "wire transfer received {transactionDate}, not logged at the time").
        </p>
      )}
    </form>
  );
}

export default function StaffUserDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  async function load() {
    try {
      const result = await api.staffGetUser(id);
      setData(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load this user.");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleBlock(reason) {
    setActionError("");
    try {
      await api.staffBlockUser(id, reason);
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not block this user.");
    }
  }

  async function handleUnblock() {
    setActionError("");
    try {
      await api.staffUnblockUser(id);
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not unblock this user.");
    }
  }

  async function handleFreeze(accountId, reason) {
    setActionError("");
    try {
      await api.staffFreezeAccount(accountId, reason);
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not freeze this account.");
    }
  }

  async function handleUnfreeze(accountId) {
    setActionError("");
    try {
      await api.staffUnfreezeAccount(accountId);
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not unfreeze this account.");
    }
  }

  async function handleApproveDoc(docId) {
    setActionError("");
    try {
      await api.staffApproveKycDocument(docId);
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not approve this document.");
    }
  }

  async function handleRejectDoc(docId, reason) {
    setActionError("");
    try {
      await api.staffRejectKycDocument(docId, reason);
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not reject this document.");
    }
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="form-error">{error}</div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout>
        <p>Loading…</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="page-header">
        <h1>{data.email}</h1>
      </div>

      {actionError && <div className="form-error">{actionError}</div>}

      <div className="panel" style={{ maxWidth: 640, marginBottom: 32 }}>
        <p>
          Role: <strong>{data.role}</strong>
        </p>
        <p>
          Email verified: <strong>{data.email_verified ? "Yes" : "No"}</strong>
        </p>
        <p>
          KYC status: <span className={`status-pill ${data.kyc_status}`}>{data.kyc_status}</span>
        </p>
        <p>
          Login: <span className={`status-pill ${data.is_frozen ? "rejected" : "verified"}`}>
            {data.is_frozen ? "blocked" : "active"}
          </span>
        </p>
        {data.is_frozen ? (
          <button className="btn-secondary" onClick={handleUnblock}>
            Unblock login
          </button>
        ) : (
          <RejectAction label="Block login" onReject={handleBlock} />
        )}
      </div>

      <h2 style={{ fontSize: "1.2rem", marginBottom: 14 }}>Accounts</h2>
      {data.accounts.length === 0 ? (
        <div className="empty-state" style={{ marginBottom: 32 }}>No accounts.</div>
      ) : (
        <div className="ledger" style={{ marginBottom: 32 }}>
          {data.accounts.map((a) => (
            <div className="ledger-row" key={a.id} style={{ flexDirection: "column", alignItems: "stretch" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div className="ledger-desc">
                    {a.name} — <span className="money">{formatCents(a.balance_cents, a.currency)}</span>
                  </div>
                  <div className="ledger-meta">
                    •••• {a.account_number.slice(-4)}
                    <span className={`status-pill ${a.status}`}>{a.status}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <AdjustmentForm accountId={a.id} onDone={load} />
                  {a.status === "frozen" ? (
                    <button className="btn-secondary" onClick={() => handleUnfreeze(a.id)}>
                      Unfreeze
                    </button>
                  ) : (
                    <RejectAction label="Freeze" onReject={(reason) => handleFreeze(a.id, reason)} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ fontSize: "1.2rem", marginBottom: 14 }}>KYC documents</h2>
      {data.kyc_documents.length === 0 ? (
        <div className="empty-state">No documents submitted.</div>
      ) : (
        <div className="ledger">
          {data.kyc_documents.map((doc) => (
            <div className="ledger-row" key={doc.id} style={{ flexDirection: "column", alignItems: "stretch" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div className="ledger-desc">{doc.doc_type.replace("_", " ")}</div>
                  <div className="ledger-meta">
                    {new Date(doc.uploaded_at).toLocaleString()}
                    <span className={`status-pill ${doc.status}`}>{doc.status}</span>
                  </div>
                </div>
                {doc.status === "pending" && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn-gold" onClick={() => handleApproveDoc(doc.id)}>
                      Approve
                    </button>
                    <RejectAction onReject={(reason) => handleRejectDoc(doc.id, reason)} />
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
