import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import CardVisual from "../components/CardVisual";
import { useAuth } from "../context/AuthContext";
import { api, ApiError } from "../api/client";
import { formatCents, formatSignedCents } from "../utils/money";
import { transactionDateLabel } from "../utils/dates";

const ACCOUNT_TYPES = [
  { value: "checking", label: "Checking" },
  { value: "savings", label: "Savings" },
  { value: "credit", label: "Credit" },
];

const QUICK_ACTIONS = [
  { to: "/cards", icon: "💳", tone: "qi-1", label: "Request card", sub: "Visa · Mastercard · Verve" },
  { to: "/loans", icon: "📈", tone: "qi-2", label: "Apply for loan", sub: "Check available rates" },
  { to: "/kyc", icon: "🪪", tone: "qi-1", label: "Verify identity", sub: "Unlock full access" },
  { to: "/transfer", icon: "↗", tone: "qi-2", label: "Transfer funds", sub: "To any account" },
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const [cards, setCards] = useState([]);
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
    api
      .listCards()
      .then(setCards)
      .catch(() => {}); // card teaser is non-critical too
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setTransactions(null);
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
  const activeCard = cards.find((c) => c.status === "active");
  const totalCents = (accounts || []).reduce((sum, a) => sum + a.balance_cents, 0);
  const currency = accounts?.[0]?.currency || "USD";
  const displayName = user?.first_name || user?.email || "";

  return (
    <AppLayout>
      <div className="topbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <div className="greet-eyebrow" style={{ fontSize: "0.78rem", color: "var(--ink-muted)", fontWeight: 600 }}>
            {greeting()}
          </div>
          <h1 style={{ marginTop: 3, marginBottom: 0 }}>Welcome back{displayName ? `, ${displayName}` : ""}</h1>
        </div>
      </div>

      {notices.map((n) => (
        <div className={`notice-banner ${n.severity}`} key={n.id}>
          <div className="notice-banner-title">{n.title}</div>
          <div className="notice-banner-message">{n.message}</div>
        </div>
      ))}

      {error && <div className="form-error">{error}</div>}

      {accounts && accounts.length > 0 && (
        <div className="balance-strip">
          <div>
            <div className="bs-label">Total balance</div>
            <div className="bs-amount">{formatCents(totalCents, currency)}</div>
          </div>
          <div className="bs-actions">
            <Link to="/transfer" className="btn-amber" style={{ textDecoration: "none" }}>
              Send money
            </Link>
            <button className="btn-outline-light" onClick={() => setShowCreate((s) => !s)}>
              {showCreate ? "Cancel" : "Open account"}
            </button>
          </div>
        </div>
      )}

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
        <div className="wallet-row" style={activeCard ? undefined : { gridTemplateColumns: "1fr" }}>
          <div>
            {accounts.map((account) => (
              <div
                key={account.id}
                className={`acc-card${account.id === selectedId ? " selected" : ""}`}
                onClick={() => setSelectedId(account.id)}
              >
                <div>
                  <div className="acc-name">{account.name}</div>
                  <div className="acc-sub">•••• {account.account_number.slice(-4)}</div>
                </div>
                <div className="acc-val money">{formatCents(account.balance_cents, account.currency)}</div>
              </div>
            ))}
          </div>
          {activeCard && <CardVisual card={activeCard} />}
        </div>
      )}

      <div className="quick-row">
        {QUICK_ACTIONS.map((q) => (
          <Link to={q.to} className="quick-tile" key={q.to}>
            <div className={`quick-icon ${q.tone}`}>{q.icon}</div>
            <div className="quick-label">{q.label}</div>
            <div className="quick-sub">{q.sub}</div>
          </Link>
        ))}
      </div>

      {selectedAccount && (
        <>
          <div className="section-title">Recent activity — {selectedAccount.name}</div>
          {transactions === null ? (
            <p>Loading transactions…</p>
          ) : transactions.length === 0 ? (
            <div className="empty-state">No transactions on this account yet.</div>
          ) : (
            <div className="activity-list">
              {transactions.map((tx) => {
                const isCredit = tx.amount_cents >= 0;
                return (
                  <div className="activity-row" key={tx.id}>
                    <div className={`activity-icon ${isCredit ? "ai-in" : "ai-out"}`}>{isCredit ? "💰" : "↗"}</div>
                    <div style={{ flex: 1 }}>
                      <div className="activity-name">{tx.description}</div>
                      <div className="activity-time">
                        {transactionDateLabel(tx)}
                        <span className={`status-pill ${tx.status}`}>{tx.status}</span>
                      </div>
                    </div>
                    <div className={`activity-amount money ${isCredit ? "amt-plus" : ""}`}>
                      {formatSignedCents(tx.amount_cents, selectedAccount.currency)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}
