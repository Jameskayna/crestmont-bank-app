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

  async function login({ email, password, totpCode }) {
    const data = await api.login({
      email,
      password,
      ...(totpCode ? { totp_code: totpCode } : {}),
    });
    if (data.requires_2fa) {
      return { requiresTwoFactor: true };
    }
    applySession(data);
    return { requiresTwoFactor: false };
  }

  async function register(fields) {
    return api.register(fields);
  }

  function logout() {
    clearSession();
  }

  const value = { user, initializing, login, register, logout, setUser };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
