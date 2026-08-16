import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import ConfirmAction from "../../components/ConfirmAction";
import RejectAction from "../../components/RejectAction";
import { api, ApiError } from "../../api/client";

export default function StaffCards() {
  const [cards, setCards] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      const data = await api.staffListCards();
      setCards(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load cards.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function block(id, reason) {
    setError("");
    try {
      await api.staffBlockCard(id, reason);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not block this card.");
    }
  }

  async function reactivate(id) {
    setError("");
    try {
      await api.staffReactivateCard(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reactivate this card.");
    }
  }

  async function approve(id) {
    setError("");
    try {
      await api.staffApproveCard(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not approve this request.");
    }
  }

  async function reject(id, reason) {
    setError("");
    try {
      await api.staffRejectCard(id, reason);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reject this request.");
    }
  }

  return (
    <AdminLayout>
      <div className="page-header">
        <h1>Cards</h1>
      </div>

      {error && <div className="form-error">{error}</div>}

      {cards === null ? (
        <p>Loading…</p>
      ) : cards.length === 0 ? (
        <div className="empty-state">No cards issued yet.</div>
      ) : (
        <div className="ledger">
          {cards.map((c) => (
            <div
              className="ledger-row"
              key={c.id}
              style={{ flexDirection: "column", alignItems: "stretch" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div className="ledger-desc">
                    {c.cardholder_name} — {c.cardholder_email}
                  </div>
                  <div className="ledger-meta money">
                    {c.masked_number ? c.masked_number : `${c.brand_display} ${c.card_type}`}
                    <span className={`status-pill ${c.status}`}>{c.status}</span>
                  </div>
                  <div className="ledger-meta">
                    {c.status === "pending" && `Requested ${new Date(c.created_at).toLocaleString()}`}
                    {c.status === "blocked" && c.block_reason && `Reason: ${c.block_reason}`}
                    {c.status === "rejected" && c.rejection_reason && `Reason: ${c.rejection_reason}`}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {c.status === "pending" && (
                    <>
                      <button className="btn-gold" onClick={() => approve(c.id)}>
                        Approve
                      </button>
                      <RejectAction onReject={(reason) => reject(c.id, reason)} />
                    </>
                  )}
                  {c.status === "active" && (
                    <RejectAction label="Block" onReject={(reason) => block(c.id, reason)} />
                  )}
                  {c.status === "blocked" && (
                    <ConfirmAction
                      label="Reactivate"
                      confirmLabel="Confirm reactivation"
                      prompt={`Reactivate card ending ${c.last4}?`}
                      onConfirm={() => reactivate(c.id)}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
