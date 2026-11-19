import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, onAuthLost, restoreSession, tokens } from "./api";

const AuthContext = createContext(null);

export const ROLE_LABEL = {
  SUPER_ADMIN: "Super Administrator",
  BURSARY: "Bursary Officer",
  STAFF: "Staff",
};

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | authed | anon

  const loadMe = useCallback(async () => {
    const me = await api("auth/me/");
    setUser(me);
    setStatus("authed");
    return me;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (tokens.refresh && (await restoreSession())) {
        try {
          if (!cancelled) await loadMe();
          return;
        } catch { /* fall through to anonymous */ }
      }
      if (!cancelled) setStatus("anon");
    })();
    return () => { cancelled = true; };
  }, [loadMe]);

  useEffect(
    () => onAuthLost(() => {
      setUser(null);
      setStatus("anon");
      queryClient.clear();
    }),
    [queryClient],
  );

  const login = useCallback(async (username, password) => {
    const data = await api("auth/login/", { method: "POST", body: { username, password } });
    tokens.set({ access: data.access, refresh: data.refresh });
    return loadMe();
  }, [loadMe]);

  const logout = useCallback(async () => {
    const refresh = tokens.refresh;
    try {
      if (refresh) await api("auth/logout/", { method: "POST", body: { refresh } });
    } catch { /* already expired: nothing to revoke */ }
    tokens.clear();
    setUser(null);
    setStatus("anon");
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo(() => {
    const role = user?.role;
    return {
      user,
      status,
      login,
      logout,
      isSuper: role === "SUPER_ADMIN",
      isManager: role === "SUPER_ADMIN" || role === "BURSARY",
    };
  }, [user, status, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
