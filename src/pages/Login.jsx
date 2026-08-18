import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";
import OtpField from "../components/OtpField";

export default function Login() {
  const { login, verifyLoginOtp, resendLoginOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [totpCode, setTotpCode] = useState("");
  // "password" -> "otp" once the backend has emailed a code. requiresTwoFactor
  // tracks whether this account also needs its authenticator-app code
  // alongside the emailed one.
  const [step, setStep] = useState("password");
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = location.state?.from?.pathname || "/dashboard";
  const justRegistered = location.state?.registered;

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await login({ email, password });
      setRequiresTwoFactor(result.requiresTwoFactor);
      setStep("otp");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOtpSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await verifyLoginOtp({ email, code, totpCode: requiresTwoFactor ? totpCode : undefined });
      navigate(redirectTo, { replace: true });
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
          {step === "otp" ? "Check your email for a verification code" : "Sign in to your account"}
        </p>

        {error && <div className="form-error">{error}</div>}
        {!error && justRegistered && step === "password" && (
          <div className="form-success">Account created. Sign in to continue.</div>
        )}

        {step === "password" ? (
          <form onSubmit={handlePasswordSubmit}>
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
              <p className="field-hint">
                <Link to="/forgot-password" className="btn-link">
                  Forgot password?
                </Link>
              </p>
            </div>
            <button className="btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Please wait…" : "Sign in"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit}>
            <p className="field-hint">We sent a 6-digit code to {email}.</p>
            <OtpField
              id="login-otp"
              value={code}
              onChange={setCode}
              onResend={() => resendLoginOtp(email)}
            />
            {requiresTwoFactor && (
              <div className="field">
                <label htmlFor="totp">Authenticator app code</label>
                <input
                  id="totp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                />
              </div>
            )}
            <button className="btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Please wait…" : "Verify & sign in"}
            </button>
          </form>
        )}

        {step === "password" && (
          <p className="auth-switch">
            New to Crestmont? <Link to="/register">Open an account</Link>
          </p>
        )}
      </div>
    </div>
  );
}
