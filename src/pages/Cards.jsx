import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import CardVisual from "../components/CardVisual";
import { api, ApiError } from "../api/client";

const BRANDS = [
  { value: "visa", label: "Visa" },
  { value: "mastercard", label: "Mastercard" },
  { value: "verve", label: "Verve" },
];

const CARD_TYPES = [
  { value: "debit", label: "Debit" },
  { value: "credit", label: "Credit" },
];

export default function Cards() {
  const [accounts, setAccounts] = useState(null);
  const [cards, setCards] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [accountId, setAccountId] = useState("");
  const [brand, setBrand] = useState(BRANDS[0].value);
  const [cardType, setCardType] = useState(CARD_TYPES[0].value);

  async function loadCards() {
    try {
      const data = await api.listCards();
      setCards(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load your cards.");
    }
  }

  useEffect(() => {
    api
      .listAccounts()
      .then((data) => {
        setAccounts(data);
        if (data.length > 0) setAccountId(data[0].id);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load accounts."));
    loadCards();
  }, []);

  // A request is only blocked account-side if that specific account already
  // has a card that's pending or active — mirrors the server-side check.
  const hasOpenRequest = (id) =>
    cards?.some((c) => c.account === id && (c.status === "pending" || c.status === "active"));

  const eligibleAccounts = accounts?.filter((a) => !hasOpenRequest(a.id)) || [];

  // Keep the selected account in sync with which accounts are still
  // eligible — otherwise a stale, now-occupied account could stay selected
  // in state while the <select> visibly shows a different one.
  useEffect(() => {
    if (eligibleAccounts.length === 0) return;
    if (!eligibleAccounts.some((a) => a.id === accountId)) {
      setAccountId(eligibleAccounts[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligibleAccounts.map((a) => a.id).join(",")]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await api.requestCard({ account: accountId, brand, card_type: cardType });
      setSuccess("Card request submitted.");
      setShowForm(false);
      await loadCards();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not submit the request.");
    } finally {
      setSubmitting(false);
    }
  }

  const canRequest = eligibleAccounts.length > 0;

  return (
    <AppLayout>
      <div className="page-header">
        <h1>Cards</h1>
        {canRequest && cards !== null && (
          <button className="btn-secondary" onClick={() => setShowForm((s) => !s)}>
            {showForm ? "Cancel" : "Request a card"}
          </button>
        )}
      </div>

      {error && <div className="form-error">{error}</div>}
      {success && <div className="form-success">{success}</div>}

      {showForm && (
        <form className="panel" style={{ marginBottom: 36 }} onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="account">Account</label>
            <select id="account" value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
              {eligibleAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — •••• {a.account_number.slice(-4)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="brand">Card network</label>
            <select id="brand" value={brand} onChange={(e) => setBrand(e.target.value)}>
              {BRANDS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="card-type">Card type</label>
            <select id="card-type" value={cardType} onChange={(e) => setCardType(e.target.value)}>
              {CARD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <button className="btn-gold" type="submit" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit request"}
          </button>
        </form>
      )}

      {cards === null ? (
        <p>Loading…</p>
      ) : cards.length === 0 ? (
        <div className="empty-state">
          <p>You don't have a card yet.</p>
          {!showForm && canRequest && (
            <button className="btn-gold" onClick={() => setShowForm(true)}>
              Request a card
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
          {cards.map((card) => (
            <CardVisual card={card} key={card.id} onRequestAgain={() => setShowForm(true)} />
          ))}
        </div>
      )}
    </AppLayout>
  );
}
