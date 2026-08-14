import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fields, setFields] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone_number: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(key, value) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(fields);
      navigate("/login", {
        replace: true,
        state: { registered: true },
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create your account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>Open an account</h1>
        <p className="auth-subtitle">Create your Crestmont Reserve Bank login</p>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={fields.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={10}
              value={fields.password}
              onChange={(e) => update("password", e.target.value)}
            />
            <p className="field-hint">At least 10 characters.</p>
          </div>
          <div className="field">
            <label htmlFor="first_name">First name</label>
            <input
              id="first_name"
              type="text"
              autoComplete="given-name"
              value={fields.first_name}
              onChange={(e) => update("first_name", e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="last_name">Last name</label>
            <input
              id="last_name"
              type="text"
              autoComplete="family-name"
              value={fields.last_name}
              onChange={(e) => update("last_name", e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="phone_number">Phone number</label>
            <input
              id="phone_number"
              type="tel"
              autoComplete="tel"
              value={fields.phone_number}
              onChange={(e) => update("phone_number", e.target.value)}
            />
          </div>

          <button className="btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
