import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api, ApiError } from "../api/client";
import { formatCents } from "../utils/money";

export default function Loans() {
  const [products, setProducts] = useState(null);
  const [applications, setApplications] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [productId, setProductId] = useState("");
  const [amount, setAmount] = useState("");
  const [term, setTerm] = useState("");
  const [purpose, setPurpose] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");

  async function loadApplications() {
    try {
      const data = await api.listLoanApplications();
      setApplications(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load applications.");
    }
  }

  useEffect(() => {
    api
      .listLoanProducts()
      .then((data) => {
        setProducts(data);
        if (data.length > 0) setProductId(data[0].id);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load loan products."));
    loadApplications();
  }, []);

  const selectedProduct = products?.find((p) => p.id === productId);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const amountCents = Math.round(parseFloat(amount) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    const termMonths = parseInt(term, 10);
    if (!Number.isFinite(termMonths) || termMonths <= 0) {
      setError("Enter a valid term in months.");
      return;
    }

    setSubmitting(true);
    try {
      await api.createLoanApplication({
        product: productId,
        requested_amount_cents: amountCents,
        term_months: termMonths,
        purpose,
        ...(monthlyIncome ? { monthly_income_cents: Math.round(parseFloat(monthlyIncome) * 100) } : {}),
      });
      setSuccess("Loan application submitted.");
      setAmount("");
      setTerm("");
      setPurpose("");
      setMonthlyIncome("");
      await loadApplications();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not submit the application.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppLayout>
      <div className="page-header">
        <h1>Loans</h1>
      </div>

      {error && <div className="form-error">{error}</div>}
      {success && <div className="form-success">{success}</div>}

      {products === null ? (
        <p>Loading…</p>
      ) : products.length === 0 ? (
        <div className="empty-state">No loan products are available right now.</div>
      ) : (
        <form className="panel" style={{ marginBottom: 36 }} onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="product">Loan product</label>
            <select id="product" value={productId} onChange={(e) => setProductId(e.target.value)} required>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {(p.annual_interest_rate_bps / 100).toFixed(2)}% APR
                </option>
              ))}
            </select>
            {selectedProduct && (
              <p className="field-hint">
                {formatCents(selectedProduct.min_amount_cents)}–{formatCents(selectedProduct.max_amount_cents)},{" "}
                {selectedProduct.min_term_months}–{selectedProduct.max_term_months} months
              </p>
            )}
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
            <label htmlFor="term">Term (months)</label>
            <input
              id="term"
              type="number"
              min="1"
              step="1"
              required
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="purpose">Purpose</label>
            <input
              id="purpose"
              type="text"
              maxLength={255}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="income">Monthly income (USD, optional)</label>
            <input
              id="income"
              type="number"
              min="0"
              step="0.01"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(e.target.value)}
            />
          </div>
          <button className="btn-gold" type="submit" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit application"}
          </button>
        </form>
      )}

      <h2 style={{ fontSize: "1.2rem", marginBottom: 14 }}>Your applications</h2>
      {applications === null ? (
        <p>Loading…</p>
      ) : applications.length === 0 ? (
        <div className="empty-state">No loan applications yet.</div>
      ) : (
        <div className="ledger">
          {applications.map((a) => (
            <div className="ledger-row" key={a.id}>
              <div>
                <div className="ledger-desc">
                  {a.product.name} — {formatCents(a.requested_amount_cents)} over {a.term_months} months
                </div>
                {a.purpose && <div className="ledger-meta">{a.purpose}</div>}
                <div className="ledger-meta">
                  {new Date(a.created_at).toLocaleString()}
                  <span className={`status-pill ${a.status}`}>{a.status.replace("_", " ")}</span>
                </div>
                {a.status === "rejected" && a.rejection_reason && (
                  <div className="ledger-meta" style={{ color: "var(--danger)" }}>
                    {a.rejection_reason}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
