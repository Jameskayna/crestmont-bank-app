import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import OtpField from "../components/OtpField";
import { api, ApiError } from "../api/client";
import { formatCents } from "../utils/money";

export default function Transfer() {
  const [accounts, setAccounts] = useState(null);
  const [fromAccount, setFromAccount] = useState("");
  const [toAccount, setToAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // "form" -> "otp" once the transfer is initiated and a code has been
  // emailed. No money moves and nothing is posted to the ledger until the
  // code is confirmed — pendingTransfer only remembers what to show while
  // that confirmation is in flight.
  const [step, setStep] = useState("form");
  const [pendingTransfer, setPendingTransfer] = useState(null);
  const [code, setCode] = useState("");

  useEffect(() => {
    api
      .listAccounts()
      .then((data) => {
        setAccounts(data);
        if (data.length > 0) setFromAccount(data[0].id);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load accounts."));
  }, []);

  async function handleInitiate(e) {
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
      const result = await api.initiateTransfer({
        from_account: fromAccount,
        to_account: toAccount.trim(),
        amount_cents: amountCents,
      });
      setPendingTransfer({ id: result.transfer_intent_id, toAccount: toAccount.trim(), amountCents });
      setStep("otp");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not submit the transfer.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirm(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.confirmTransfer(pendingTransfer.id, code);
      setSuccess("Transfer sent.");
      setStep("form");
      setPendingTransfer(null);
      setCode("");
      setToAccount("");
      setAmount("");
      setNote("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not confirm the transfer.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancelOtp() {
    setStep("form");
    setPendingTransfer(null);
    setCode("");
    setError("");
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
      ) : step === "form" ? (
        <form className="panel" onSubmit={handleInitiate}>
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
            <label htmlFor="to">To account number</label>
            <input
              id="to"
              type="text"
              placeholder="Destination account number"
              required
              value={toAccount}
              onChange={(e) => setToAccount(e.target.value)}
            />
            <p className="field-hint">The recipient's account number, e.g. 4932.</p>
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
      ) : (
        <form className="panel" onSubmit={handleConfirm}>
          <p className="field-hint">
            We sent a 6-digit code to your email to confirm sending{" "}
            <span className="money">{formatCents(pendingTransfer.amountCents)}</span> to account ••••{" "}
            {pendingTransfer.toAccount.slice(-4)}. Nothing has been sent yet.
          </p>
          <OtpField id="transfer-otp" value={code} onChange={setCode} onResend={() => api.resendTransferOtp(pendingTransfer.id)} />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-gold" type="submit" disabled={submitting}>
              {submitting ? "Confirming…" : "Confirm transfer"}
            </button>
            <button className="btn-link" type="button" onClick={handleCancelOtp}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </AppLayout>
  );
}
