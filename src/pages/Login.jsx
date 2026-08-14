import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = location.state?.from?.pathname || "/dashboard";
  const justRegistered = location.state?.registered;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await login({ email, password, totpCode: needsTwoFactor ? totpCode : undefined });
      if (result.requiresTwoFactor) {
        setNeedsTwoFactor(true);
      } else {
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>Crestmont Reserve Bank</h1>
        <p className="auth-subtitle">
          {needsTwoFactor ? "Enter the code from your authenticator app" : "Sign in to your account"}
        </p>

        {error && <div className="form-error">{error}</div>}
        {!error && justRegistered && !needsTwoFactor && (
          <div className="form-success">Account created. Sign in to continue.</div>
        )}

        <form onSubmit={handleSubmit}>
          {!needsTwoFactor ? (
            <>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </>
          ) : (
            <div className="field">
              <label htmlFor="totp">Authentication code</label>
              <input
                id="totp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                autoFocus
                required
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
              />
              <p className="field-hint">Signing in as {email}</p>
            </div>
          )}

          <button className="btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Please wait…" : needsTwoFactor ? "Verify & sign in" : "Sign in"}
          </button>
        </form>

        {!needsTwoFactor && (
          <p className="auth-switch">
            New to Crestmont? <Link to="/register">Open an account</Link>
          </p>
        )}
      </div>
    </div>
  );
}
