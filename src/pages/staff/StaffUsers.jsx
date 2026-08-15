import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { api, ApiError } from "../../api/client";

export default function StaffUsers() {
  const [users, setUsers] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

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
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    setUsers(null);
    load(search);
  }

  return (
    <AdminLayout>
      <div className="page-header">
        <h1>Users &amp; Accounts</h1>
      </div>

      {error && <div className="form-error">{error}</div>}

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
            <Link
              to={`/staff/users/${u.id}`}
              key={u.id}
              className="ledger-row"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div>
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
              </div>
            </Link>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
