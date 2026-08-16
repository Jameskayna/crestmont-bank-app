import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell customer-theme">
      <aside className="app-sidebar">
        <div>
          <div className="brand-mark">C</div>
          <div className="brand-word">Crestmont</div>
          <div className="brand-tag">Reserve Bank</div>
        </div>
        <nav>
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>
            Overview
          </NavLink>
          <NavLink to="/transfer" className={({ isActive }) => (isActive ? "active" : "")}>
            Transfers
          </NavLink>
          <NavLink to="/cards" className={({ isActive }) => (isActive ? "active" : "")}>
            Cards
          </NavLink>
          <NavLink to="/kyc" className={({ isActive }) => (isActive ? "active" : "")}>
            Identity verification
          </NavLink>
          <NavLink to="/notifications" className={({ isActive }) => (isActive ? "active" : "")}>
            Notifications
          </NavLink>
          <NavLink to="/loans" className={({ isActive }) => (isActive ? "active" : "")}>
            Loans
          </NavLink>
          {user && user.role !== "customer" && (
            <NavLink
              to="/staff/users"
              className={({ isActive }) => (isActive ? "active" : "")}
              style={{ marginTop: 10, color: "var(--gold-light)" }}
            >
              Staff console
            </NavLink>
          )}
        </nav>
        <div>
          {user && <p className="app-sidebar-email">{user.email}</p>}
          <button className="app-sidebar-signout" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="app-main">{children}</main>
    </div>
  );
}
