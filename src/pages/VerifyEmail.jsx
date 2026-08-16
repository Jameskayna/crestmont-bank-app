import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, ApiError } from "../api/client";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("This verification link is missing its token. Check that you copied the full link.");
      return;
    }
    api
      .verifyEmail(token)
      .then((data) => {
        setStatus("success");
        setMessage(data.message || "Email verified. You can now sign in.");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof ApiError ? err.message : "This verification link is invalid or has expired.");
      });
  }, [token]);

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>Crestmont Reserve Bank</h1>
        <p className="auth-subtitle">Email verification</p>

        {status === "verifying" && <p style={{ textAlign: "center" }}>Verifying your email…</p>}
        {status === "success" && <div className="form-success">{message}</div>}
        {status === "error" && <div className="form-error">{message}</div>}

        {status !== "verifying" && (
          <p className="auth-switch">
            <Link to="/login">Back to sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}
