import { useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../api/client";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.requestPasswordReset(email);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not submit your request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>Crestmont Reserve Bank</h1>
        <p className="auth-subtitle">Reset your password</p>

        {submitted ? (
          <div className="form-success">
            If an account exists for that email, we've sent reset instructions.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="form-error">{error}</div>}
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
            <button className="btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Please wait…" : "Send reset instructions"}
            </button>
          </form>
        )}

        <p className="auth-switch">
          <Link to="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
