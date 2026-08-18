import { useEffect, useState } from "react";

// Shared 6-digit code entry + resend affordance for both the login and
// transfer email-OTP steps. Cooldown here is purely a UX nicety mirroring
// the backend's real 60s resend cooldown (django-otp's CooldownMixin) —
// the backend enforces the actual limit regardless of what this shows.
export default function OtpField({ id = "otp-code", label = "Verification code", value, onChange, onResend }) {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function handleResend() {
    setResending(true);
    setResent(false);
    try {
      await onResend();
      setResent(true);
      setCooldown(60);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        autoFocus
        required
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
      />
      <p className="field-hint">
        Code expires in 10 minutes.{" "}
        {cooldown > 0 ? (
          `Resend available in ${cooldown}s`
        ) : (
          <button type="button" className="btn-link" onClick={handleResend} disabled={resending}>
            {resending ? "Sending…" : "Resend code"}
          </button>
        )}
        {resent && cooldown === 60 && " — a new code is on its way."}
      </p>
    </div>
  );
}
