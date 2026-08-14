import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="brand">
          Crestmont Reserve
          <span>Bank</span>
        </div>
        <nav>
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>
            Overview
          </NavLink>
          <NavLink to="/transfer" className={({ isActive }) => (isActive ? "active" : "")}>
            Transfers
          </NavLink>
        </nav>
        <div>
          {user && (
            <p style={{ color: "rgba(250,248,244,0.55)", fontSize: "0.78rem", marginBottom: 10 }}>{user.email}</p>
          )}
          <button onClick={logout}>Sign out</button>
        </div>
      </aside>
      <main className="app-main">{children}</main>
    </div>
  );
}
