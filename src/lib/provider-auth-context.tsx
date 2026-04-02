"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface ProviderUser {
  id: string;
  name: string;
  credentials: string;
  email: string;
}

interface ProviderAuthContextType {
  provider: ProviderUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const ProviderAuthContext = createContext<ProviderAuthContextType | undefined>(undefined);

export function ProviderAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [provider, setProvider] = useState<ProviderUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/provider/auth/me", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setProvider(data?.provider ?? null))
      .catch(() => setProvider(null))
      .finally(() => setIsLoading(false));
  }, []);

  async function login(email: string, password: string): Promise<void> {
    const res = await fetch("/api/provider/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? "Login failed");
    }
    const data = await res.json();
    setProvider(data.provider);
    router.push("/provider");
  }

  async function logout(): Promise<void> {
    await fetch("/api/provider/auth/logout", { method: "POST", credentials: "same-origin" });
    setProvider(null);
    router.push("/provider/login");
  }

  return (
    <ProviderAuthContext.Provider
      value={{ provider, isAuthenticated: !!provider, isLoading, login, logout }}
    >
      {children}
    </ProviderAuthContext.Provider>
  );
}

export function useProviderAuth() {
  const ctx = useContext(ProviderAuthContext);
  if (!ctx) throw new Error("useProviderAuth must be used within ProviderAuthProvider");
  return ctx;
}
