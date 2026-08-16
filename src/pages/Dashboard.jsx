import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import CardVisual from "../components/CardVisual";
import { api, ApiError } from "../api/client";
import { formatCents, formatSignedCents } from "../utils/money";

const ACCOUNT_TYPES = [
  { value: "checking", label: "Checking" },
  { value: "savings", label: "Savings" },
  { value: "credit", label: "Credit" },
];

export default function Dashboard() {
  const [accounts, setAccounts] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const [cards, setCards] = useState(null);
  const [notices, setNotices] = useState([]);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("checking");
  const [creating, setCreating] = useState(false);

  async function loadAccounts() {
    try {
      const data = await api.listAccounts();
      setAccounts(data);
      if (data.length > 0) {
        setSelectedId((current) => current ?? data[0].id);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load accounts.");
    }
  }

  useEffect(() => {
    loadAccounts();
    api
      .listActiveNotices()
      .then(setNotices)
      .catch(() => {}); // banner is non-critical — a failed fetch shouldn't block the dashboard
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setTransactions(null);
      setCards(null);
      return;
    }
    let cancelled = false;
    api
      .accountTransactions(selectedId)
      .then((data) => {
        if (!cancelled) setTransactions(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Could not load transactions.");
      });
    api
      .accountCards(selectedId)
      .then((data) => {
        if (!cancelled) setCards(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Could not load cards.");
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  async function handleCreateAccount(e) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const account = await api.createAccount({ name: newName, type: newType, currency: "USD" });
      setShowCreate(false);
      setNewName("");
      setAccounts((prev) => [...(prev || []), account]);
      setSelectedId(account.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not open the account.");
    } finally {
      setCreating(false);
    }
  }

  const selectedAccount = accounts?.find((a) => a.id === selectedId);

  return (
    <AppLayout>
      {notices.map((n) => (
        <div className={`notice-banner ${n.severity}`} key={n.id}>
          <div className="notice-banner-title">{n.title}</div>
          <div className="notice-banner-message">{n.message}</div>
        </div>
      ))}

      <div className="page-header">
        <h1>Overview</h1>
        {accounts && accounts.length > 0 && (
          <button className="btn-secondary" onClick={() => setShowCreate((s) => !s)}>
            {showCreate ? "Cancel" : "Open another account"}
          </button>
        )}
      </div>

      {error && <div className="form-error">{error}</div>}

      {showCreate && (
        <form className="panel" style={{ marginBottom: 28 }} onSubmit={handleCreateAccount}>
          <div className="field">
            <label htmlFor="acct-name">Account name</label>
            <input id="acct-name" required value={newName} onChange={(e) => setNewName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="acct-type">Type</label>
            <select id="acct-type" value={newType} onChange={(e) => setNewType(e.target.value)}>
              {ACCOUNT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <button className="btn-gold" type="submit" disabled={creating}>
            {creating ? "Opening…" : "Open account"}
          </button>
        </form>
      )}

      {accounts === null ? (
        <p>Loading accounts…</p>
      ) : accounts.length === 0 ? (
        <div className="empty-state">
          <p>You don't have any accounts yet.</p>
          {!showCreate && (
            <button className="btn-gold" onClick={() => setShowCreate(true)}>
              Open your first account
            </button>
          )}
        </div>
      ) : (
        <div className="account-grid">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`account-card${account.id === selectedId ? " selected" : ""}`}
              onClick={() => setSelectedId(account.id)}
            >
              <div className="account-type">{account.type}</div>
              <div className="account-name">{account.name}</div>
              <div className="account-balance money">{formatCents(account.balance_cents, account.currency)}</div>
              <div className="account-number">
                Account •••• {account.account_number.slice(-4)}
                <span className="status-pill posted" style={{ marginLeft: 8 }}>
                  {account.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedAccount && cards && cards.length > 0 && (
        <>
          <h2 style={{ fontSize: "1.2rem", marginBottom: 14 }}>Card — {selectedAccount.name}</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginBottom: 36 }}>
            {cards.map((card) => (
              <CardVisual card={card} key={card.id} />
            ))}
          </div>
        </>
      )}

      {selectedAccount && (
        <>
          <h2 style={{ fontSize: "1.2rem", marginBottom: 14 }}>
            Recent activity — {selectedAccount.name}
          </h2>
          {transactions === null ? (
            <p>Loading transactions…</p>
          ) : transactions.length === 0 ? (
            <div className="empty-state">No transactions on this account yet.</div>
          ) : (
            <div className="ledger">
              {transactions.map((tx) => (
                <div className="ledger-row" key={tx.id}>
                  <div>
                    <div className="ledger-desc">{tx.description}</div>
                    <div className="ledger-meta">
                      {new Date(tx.created_at).toLocaleString()}
                      <span className={`status-pill ${tx.status}`}>{tx.status}</span>
                    </div>
                  </div>
                  <div className={`ledger-amount money ${tx.amount_cents >= 0 ? "credit" : "debit"}`}>
                    {formatSignedCents(tx.amount_cents, selectedAccount.currency)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}
