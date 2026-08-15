import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { useAuth } from "../../context/AuthContext";
import { api, ApiError } from "../../api/client";
import { formatCents } from "../../utils/money";

const emptyForm = {
  name: "",
  annual_interest_rate_bps: "",
  min_amount_cents: "",
  max_amount_cents: "",
  min_term_months: "",
  max_term_months: "",
};

export default function StaffSettings() {
  const { user } = useAuth();
  const canConfigure = user?.role === "admin" || user?.role === "superadmin";

  const [products, setProducts] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try {
      const data = await api.staffListLoanProducts();
      setProducts(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load loan products.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await api.staffCreateLoanProduct({
        name: form.name,
        annual_interest_rate_bps: parseInt(form.annual_interest_rate_bps, 10),
        min_amount_cents: Math.round(parseFloat(form.min_amount_cents) * 100),
        max_amount_cents: Math.round(parseFloat(form.max_amount_cents) * 100),
        min_term_months: parseInt(form.min_term_months, 10),
        max_term_months: parseInt(form.max_term_months, 10),
      });
      setForm(emptyForm);
      setShowCreate(false);
      setSuccess("Loan product created.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create the loan product.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(product) {
    setError("");
    try {
      await api.staffUpdateLoanProduct(product.id, { is_active: !product.is_active });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update the loan product.");
    }
  }

  return (
    <AdminLayout>
      <div className="page-header">
        <h1>Settings</h1>
        {canConfigure && (
          <button className="btn-secondary" onClick={() => setShowCreate((s) => !s)}>
            {showCreate ? "Cancel" : "New loan product"}
          </button>
        )}
      </div>

      {error && <div className="form-error">{error}</div>}
      {success && <div className="form-success">{success}</div>}

      {showCreate && (
        <form className="panel" style={{ marginBottom: 32 }} onSubmit={handleCreate}>
          <div className="field">
            <label htmlFor="name">Name</label>
            <input id="name" required value={form.name} onChange={(e) => update("name", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="rate">Annual interest rate (basis points, e.g. 1250 = 12.50%)</label>
            <input
              id="rate"
              type="number"
              min="1"
              required
              value={form.annual_interest_rate_bps}
              onChange={(e) => update("annual_interest_rate_bps", e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="min-amount">Min amount (USD)</label>
            <input
              id="min-amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={form.min_amount_cents}
              onChange={(e) => update("min_amount_cents", e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="max-amount">Max amount (USD)</label>
            <input
              id="max-amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={form.max_amount_cents}
              onChange={(e) => update("max_amount_cents", e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="min-term">Min term (months)</label>
            <input
              id="min-term"
              type="number"
              min="1"
              required
              value={form.min_term_months}
              onChange={(e) => update("min_term_months", e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="max-term">Max term (months)</label>
            <input
              id="max-term"
              type="number"
              min="1"
              required
              value={form.max_term_months}
              onChange={(e) => update("max_term_months", e.target.value)}
            />
          </div>
          <button className="btn-gold" type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create product"}
          </button>
        </form>
      )}

      {products === null ? (
        <p>Loading…</p>
      ) : products.length === 0 ? (
        <div className="empty-state">No loan products configured.</div>
      ) : (
        <div className="ledger">
          {products.map((p) => (
            <div className="ledger-row" key={p.id}>
              <div>
                <div className="ledger-desc">
                  {p.name} — {(p.annual_interest_rate_bps / 100).toFixed(2)}% APR
                </div>
                <div className="ledger-meta">
                  {formatCents(p.min_amount_cents)}–{formatCents(p.max_amount_cents)}, {p.min_term_months}–
                  {p.max_term_months} months
                  <span className={`status-pill ${p.is_active ? "verified" : "unverified"}`}>
                    {p.is_active ? "active" : "inactive"}
                  </span>
                </div>
              </div>
              {canConfigure && (
                <button className="btn-secondary" onClick={() => toggleActive(p)}>
                  {p.is_active ? "Deactivate" : "Activate"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
