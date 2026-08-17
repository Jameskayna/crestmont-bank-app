import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import ConfirmAction from "../../components/ConfirmAction";
import { useAuth } from "../../context/AuthContext";
import { api, ApiError } from "../../api/client";

const ADMIN_ROLES = ["admin", "superadmin"];

export default function StaffUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const canPromote = currentUser && ADMIN_ROLES.includes(currentUser.role);

  async function load(query) {
    try {
      const data = await api.staffListUsers(query);
      setUsers(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load users.");
    }
  }

  useEffect(() => {
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    setUsers(null);
    load(search);
  }

  async function handlePromote(id) {
    setActionError("");
    try {
      await api.staffPromoteUser(id);
      await load(search);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not promote this user.");
    }
  }

  async function handleDemote(id) {
    setActionError("");
    try {
      await api.staffDemoteUser(id);
      await load(search);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not revoke admin access for this user.");
    }
  }

  return (
    <AdminLayout>
      <div className="page-header">
        <h1>Users &amp; Accounts</h1>
      </div>

      {error && <div className="form-error">{error}</div>}
      {actionError && <div className="form-error">{actionError}</div>}

      <form onSubmit={handleSearch} style={{ marginBottom: 24, display: "flex", gap: 10 }}>
        <input
          type="text"
          placeholder="Search by email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <button className="btn-secondary" type="submit">
          Search
        </button>
      </form>

      {users === null ? (
        <p>Loading…</p>
      ) : users.length === 0 ? (
        <div className="empty-state">No users found.</div>
      ) : (
        <div className="ledger">
          {users.map((u) => (
            <div
              key={u.id}
              className="ledger-row"
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <Link
                to={`/staff/users/${u.id}`}
                style={{ textDecoration: "none", color: "inherit", flex: 1 }}
              >
                <div className="ledger-desc">{u.email}</div>
                <div className="ledger-meta">
                  {u.role}
                  <span className={`status-pill ${u.kyc_status}`}>{u.kyc_status.replace("_", " ")}</span>
                  {u.is_frozen && (
                    <span className="status-pill rejected" style={{ marginLeft: 6 }}>
                      blocked
                    </span>
                  )}
                </div>
              </Link>
              {canPromote && !ADMIN_ROLES.includes(u.role) && (
                <ConfirmAction
                  label="Make Admin"
                  confirmLabel="Confirm promotion"
                  prompt={`Grant ${u.email} full admin access?`}
                  onConfirm={() => handlePromote(u.id)}
                />
              )}
              {canPromote && ADMIN_ROLES.includes(u.role) && u.id !== currentUser.id && (
                <ConfirmAction
                  label="Revoke Admin"
                  confirmLabel="Confirm revoke"
                  prompt={`Revoke admin access for ${u.email}?`}
                  onConfirm={() => handleDemote(u.id)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
