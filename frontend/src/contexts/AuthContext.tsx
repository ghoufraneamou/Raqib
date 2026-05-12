import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { API_BASE, authHeaders, readApiError } from "@/lib/api";

const TOKEN_KEY = "ammps_access_token";
const USER_KEY = "ammps_user";

export type AuthUser = { email: string; full_name: string };

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  setSession: (token: string, user: AuthUser) => void;
  logout: () => void;
  registerStart: (p: {
    email: string;
    password: string;
    full_name: string;
  }) => Promise<{ message: string; dev_code?: string }>;
  registerVerify: (email: string, code: string) => Promise<{ message: string }>;
  loginSendCode: (p: {
    email: string;
    password: string;
  }) => Promise<{ message: string; dev_code?: string }>;
  loginVerify: (p: { email: string; password: string; code: string }) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(() => loadStoredUser());
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)));

  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    if (!t) {
      setLoading(false);
      return;
    }
    fetch(`${API_BASE}/auth/me`, { headers: authHeaders(t) })
      .then((r) => {
        if (!r.ok) throw new Error("invalid");
        return r.json();
      })
      .then((data: { email: string }) => {
        setToken(t);
        setUser((u) => (u?.email === data.email ? u : { email: data.email, full_name: u?.full_name ?? "" }));
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const setSession = useCallback((newToken: string, newUser: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const registerStart = useCallback(async (p: { email: string; password: string; full_name: string }) => {
    const r = await fetch(`${API_BASE}/auth/register/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    });
    if (!r.ok) throw new Error(await readApiError(r));
    return (await r.json()) as { message: string; dev_code?: string };
  }, []);

  const registerVerify = useCallback(async (email: string, code: string) => {
    const r = await fetch(`${API_BASE}/auth/register/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: code.replace(/\s/g, "") }),
    });
    if (!r.ok) throw new Error(await readApiError(r));
    return (await r.json()) as { message: string };
  }, []);

  const loginSendCode = useCallback(async (p: { email: string; password: string }) => {
    const r = await fetch(`${API_BASE}/auth/login/send-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: p.email, password: p.password }),
    });
    if (!r.ok) throw new Error(await readApiError(r));
    return (await r.json()) as { message: string; dev_code?: string };
  }, []);

  const loginVerify = useCallback(
    async (p: { email: string; password: string; code: string }) => {
      const r = await fetch(`${API_BASE}/auth/login/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: p.email,
          password: p.password,
          code: p.code.replace(/\s/g, ""),
        }),
      });
      if (!r.ok) throw new Error(await readApiError(r));
      const data = (await r.json()) as { access_token?: string; user?: AuthUser };
      const access_token = data.access_token;
      const u = data.user;
      if (!access_token || !u) throw new Error("Réponse invalide");
      setSession(access_token, u);
    },
    [setSession]
  );

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      setSession,
      logout,
      registerStart,
      registerVerify,
      loginSendCode,
      loginVerify,
    }),
    [token, user, loading, setSession, logout, registerStart, registerVerify, loginSendCode, loginVerify]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
