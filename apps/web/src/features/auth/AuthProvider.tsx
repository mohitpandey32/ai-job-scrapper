import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCsrfToken, getMe, login, logout, signup, type PublicUser } from "../../shared/api/auth.api";

interface AuthContextValue {
  readonly user: PublicUser | null;
  readonly isLoading: boolean;
  readonly signin: (input: { email: string; password: string }) => Promise<void>;
  readonly register: (input: { email: string; password: string; fullName?: string }) => Promise<void>;
  readonly signout: () => Promise<void>;
  readonly refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshUser() {
    const response = await getMe();
    setUser(response.user);
  }

  useEffect(() => {
    void getCsrfToken()
      .then(() => refreshUser())
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      async signin(input) {
        await getCsrfToken();
        const response = await login(input);
        setUser(response.user);
      },
      async register(input) {
        await getCsrfToken();
        const response = await signup(input);
        setUser(response.user);
      },
      async signout() {
        await logout();
        setUser(null);
      },
      refreshUser,
    }),
    [isLoading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return value;
}

