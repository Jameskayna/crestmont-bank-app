import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api, ApiError } from "../api/client";

export default function Transfer() {
  const [accounts, setAccounts] = useState(null);
  const [fromAccount, setFromAccount] = useState("");
  const [toAccount, setToAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .listAccounts()
      .then((data) => {
        setAccounts(data);
        if (data.length > 0) setFromAccount(data[0].id);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load accounts."));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const amountCents = Math.round(parseFloat(amount) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    setSubmitting(true);
    try {
      await api.createTransfer({
        from_account: fromAccount,
        to_account: toAccount.trim(),
        amount_cents: amountCents,
        note,
      });
      setSuccess("Transfer submitted.");
      setToAccount("");
      setAmount("");
      setNote("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not submit the transfer.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppLayout>
      <div className="page-header">
        <h1>Transfer funds</h1>
      </div>

      {error && <div className="form-error">{error}</div>}
      {success && <div className="form-success">{success}</div>}

      {accounts === null ? (
        <p>Loading accounts…</p>
      ) : accounts.length === 0 ? (
        <div className="empty-state">Open an account first before transferring funds.</div>
      ) : (
        <form className="panel" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="from">From account</label>
            <select id="from" value={fromAccount} onChange={(e) => setFromAccount(e.target.value)} required>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — •••• {a.account_number.slice(-4)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="to">To account ID</label>
            <input
              id="to"
              type="text"
              placeholder="Destination account UUID"
              required
              value={toAccount}
              onChange={(e) => setToAccount(e.target.value)}
            />
            <p className="field-hint">The recipient's account ID, not their account number.</p>
          </div>
          <div className="field">
            <label htmlFor="amount">Amount (USD)</label>
            <input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="note">Note (optional)</label>
            <input id="note" type="text" maxLength={255} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <button className="btn-gold" type="submit" disabled={submitting}>
            {submitting ? "Sending…" : "Send transfer"}
          </button>
        </form>
      )}
    </AppLayout>
  );
}
