import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function StaffRoute({ children }) {
  const { user, initializing } = useAuth();

  if (initializing) return null;
  if (!user) return <Navigate to="/login" replace />;
  // Same gate the backend enforces (IsStaff) — this is a UX convenience,
  // not the actual security boundary, which lives server-side.
  if (user.role === "customer") return <Navigate to="/dashboard" replace />;
  return children;
}
