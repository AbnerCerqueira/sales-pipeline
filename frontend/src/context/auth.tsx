import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useToast } from "../components/toast.tsx";
import {
  clearAuthToken,
  getAuthToken,
  SESSION_EXPIRED_EVENT,
  SESSION_EXPIRED_MESSAGE,
  setAuthToken,
} from "../lib/token.ts";

interface AuthContextValue {
  login: (token: string) => void;
  logout: () => void;
  token: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getAuthToken());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    function handleSessionExpired() {
      setToken(null);
      queryClient.clear();
      toast(SESSION_EXPIRED_MESSAGE);
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () =>
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, [queryClient, toast]);

  const login = useCallback((newToken: string) => {
    setAuthToken(newToken);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    clearAuthToken();
    setToken(null);
    queryClient.clear();
  }, [queryClient]);

  return (
    <AuthContext.Provider value={{ login, logout, token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
