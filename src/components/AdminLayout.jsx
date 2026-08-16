import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="brand">
          Crestmont Reserve
          <span>Staff Console</span>
        </div>
        <nav>
          <NavLink to="/staff/users" className={({ isActive }) => (isActive ? "active" : "")}>
            Users &amp; Accounts
          </NavLink>
          <NavLink to="/staff/cards" className={({ isActive }) => (isActive ? "active" : "")}>
            Cards
          </NavLink>
          <NavLink to="/staff/transactions" className={({ isActive }) => (isActive ? "active" : "")}>
            Transactions
          </NavLink>
          <NavLink to="/staff/loans" className={({ isActive }) => (isActive ? "active" : "")}>
            Loans
          </NavLink>
          <NavLink to="/staff/notices" className={({ isActive }) => (isActive ? "active" : "")}>
            Notices
          </NavLink>
          <NavLink to="/staff/settings" className={({ isActive }) => (isActive ? "active" : "")}>
            Settings
          </NavLink>
          <NavLink to="/staff/audit-log" className={({ isActive }) => (isActive ? "active" : "")}>
            Audit Log
          </NavLink>
          <NavLink to="/dashboard" style={{ marginTop: 10 }}>
            ← Back to app
          </NavLink>
        </nav>
        <div>
          {user && (
            <p style={{ color: "rgba(250,248,244,0.55)", fontSize: "0.78rem", marginBottom: 10 }}>
              {user.email} · {user.role}
            </p>
          )}
          <button onClick={logout}>Sign out</button>
        </div>
      </aside>
      <main className="app-main">{children}</main>
    </div>
  );
}
