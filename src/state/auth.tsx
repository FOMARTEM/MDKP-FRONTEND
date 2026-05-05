import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { api, type User } from "../lib/api";
import { getStoredToken, getStoredUser, setStoredToken, setStoredUser, type StoredUser } from "../lib/storage";

type AuthState = {
  user: StoredUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider(props: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<StoredUser | null>(() => getStoredUser());

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setStoredToken(null);
    setStoredUser(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const u: User = await api.login(email, password);
    const newToken = u.token ?? null;
    setToken(newToken);
    setUser(u);
    setStoredToken(newToken);
    setStoredUser(u);
  }, []);

  const refreshMe = useCallback(async () => {
    const u = await api.myAccount();
    setUser(u);
    setStoredUser(u);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, token, login, logout, refreshMe }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
