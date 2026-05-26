import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authApi, tokenStorage, readApiError } from "@/lib/api";
import type { AdminUser } from "@/types";

interface AuthContextValue {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  const fetchMe = useCallback(async () => {
    try {
      const me = await authApi.me();
      setUser(me);
    } catch {
      setUser(null);
      tokenStorage.clear();
    }
  }, []);

  // Bootstrap session if a token is present.
  useEffect(() => {
    let active = true;
    (async () => {
      const token = tokenStorage.getAccess();
      if (!token) {
        if (active) setIsInitializing(false);
        return;
      }
      await fetchMe();
      if (active) setIsInitializing(false);
    })();
    return () => {
      active = false;
    };
  }, [fetchMe]);

  // Listen for forced logout signals from the axios interceptor.
  useEffect(() => {
    const handler = () => setUser(null);
    window.addEventListener("orion:auth:logout", handler);
    return () => window.removeEventListener("orion:auth:logout", handler);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const tokens = await authApi.login(email, password);
        tokenStorage.set(tokens.access_token, tokens.refresh_token);
        await fetchMe();
      } catch (err) {
        throw new Error(readApiError(err));
      }
    },
    [fetchMe],
  );

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isInitializing,
      login,
      logout,
      refetchUser: fetchMe,
    }),
    [user, isInitializing, login, logout, fetchMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
