import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import StaffRoute from "./components/StaffRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Transfer from "./pages/Transfer";
import Kyc from "./pages/Kyc";
import Notifications from "./pages/Notifications";
import Loans from "./pages/Loans";
import StaffUsers from "./pages/staff/StaffUsers";
import StaffUserDetail from "./pages/staff/StaffUserDetail";
import StaffCards from "./pages/staff/StaffCards";
import StaffTransactions from "./pages/staff/StaffTransactions";
import StaffLoans from "./pages/staff/StaffLoans";
import StaffNotices from "./pages/staff/StaffNotices";
import StaffSettings from "./pages/staff/StaffSettings";
import StaffAuditLog from "./pages/staff/StaffAuditLog";

function ProtectedRoute({ children }) {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return null;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transfer"
        element={
          <ProtectedRoute>
            <Transfer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/kyc"
        element={
          <ProtectedRoute>
            <Kyc />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/loans"
        element={
          <ProtectedRoute>
            <Loans />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/users"
        element={
          <StaffRoute>
            <StaffUsers />
          </StaffRoute>
        }
      />
      <Route
        path="/staff/users/:id"
        element={
          <StaffRoute>
            <StaffUserDetail />
          </StaffRoute>
        }
      />
      <Route
        path="/staff/cards"
        element={
          <StaffRoute>
            <StaffCards />
          </StaffRoute>
        }
      />
      <Route
        path="/staff/transactions"
        element={
          <StaffRoute>
            <StaffTransactions />
          </StaffRoute>
        }
      />
      <Route
        path="/staff/loans"
        element={
          <StaffRoute>
            <StaffLoans />
          </StaffRoute>
        }
      />
      <Route
        path="/staff/notices"
        element={
          <StaffRoute>
            <StaffNotices />
          </StaffRoute>
        }
      />
      <Route
        path="/staff/settings"
        element={
          <StaffRoute>
            <StaffSettings />
          </StaffRoute>
        }
      />
      <Route
        path="/staff/audit-log"
        element={
          <StaffRoute>
            <StaffAuditLog />
          </StaffRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
