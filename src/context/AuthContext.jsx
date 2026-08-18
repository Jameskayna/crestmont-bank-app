import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, setAccessToken, setOnAuthExpired } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    localStorage.removeItem("refresh_token");
    setUser(null);
  }, []);

  useEffect(() => {
    setOnAuthExpired(clearSession);
  }, [clearSession]);

  // On load, a stored refresh token is the only thing that survives a
  // page refresh (the access token is memory-only by design) — use it to
  // silently restore the session via /auth/me.
  useEffect(() => {
    async function restore() {
      const refresh = localStorage.getItem("refresh_token");
      if (!refresh) {
        setInitializing(false);
        return;
      }
      try {
        const me = await api.me();
        setUser(me);
      } catch {
        clearSession();
      } finally {
        setInitializing(false);
      }
    }
    restore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applySession({ user: sessionUser, access, refresh }) {
    setAccessToken(access);
    localStorage.setItem("refresh_token", refresh);
    setUser(sessionUser);
  }

  // Password is only step 1 now: the backend always emails a one-time code
  // before login can complete (requires_email_otp), and also flags whether
  // this account's authenticator-app 2FA needs to be entered alongside it
  // (requires_2fa). Session state is never set here — only verifyLoginOtp,
  // once the code (and TOTP, if flagged) checks out, actually logs in.
  async function login({ email, password }) {
    const data = await api.login({ email, password });
    return { email, requiresTwoFactor: !!data.requires_2fa };
  }

  async function verifyLoginOtp({ email, code, totpCode }) {
    const data = await api.verifyLoginOtp({
      email,
      code,
      ...(totpCode ? { totp_code: totpCode } : {}),
    });
    applySession(data);
  }

  async function resendLoginOtp(email) {
    return api.resendLoginOtp(email);
  }

  async function register(fields) {
    return api.register(fields);
  }

  function logout() {
    clearSession();
  }

  const value = { user, initializing, login, verifyLoginOtp, resendLoginOtp, register, logout, setUser };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
