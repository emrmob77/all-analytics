"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

import type { AppRole } from "@/lib/auth/mockAuthStore";

interface AuthSessionUser {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
  tenantId: string;
}

interface AuthSessionRecord {
  user: AuthSessionUser;
  expiresAt: string;
}

interface AuthSessionContextValue {
  session: AuthSessionRecord | null;
  isAuthenticated: boolean;
  login: (nextSession: AuthSessionRecord) => void;
  logout: () => void;
  refreshSessionExpiry: (expiresAt: string) => void;
}

const STORAGE_KEY = "allanalytics.auth.session";
const CHANNEL_NAME = "allanalytics-auth";
const DEMO_SESSION: AuthSessionRecord = {
  user: {
    id: "user_demo_1",
    email: "owner@allanalytics.app",
    fullName: "Esra Bayatli",
    role: "owner",
    tenantId: "brand-1"
  },
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

function safeReadStorage(): AuthSessionRecord | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as AuthSessionRecord;

    if (!parsed || !parsed.user || typeof parsed.expiresAt !== "string") {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function safeWriteStorage(session: AuthSessionRecord | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSessionRecord | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const storedSession = safeReadStorage();

    if (storedSession && new Date(storedSession.expiresAt).getTime() > Date.now()) {
      setSession(storedSession);
    } else {
      setSession(DEMO_SESSION);
      safeWriteStorage(DEMO_SESSION);
    }

    if (typeof BroadcastChannel !== "undefined") {
      channelRef.current = new BroadcastChannel(CHANNEL_NAME);

      channelRef.current.onmessage = (event) => {
        if (event.data?.type === "logout") {
          setSession(null);
          safeWriteStorage(null);
        }

        if (event.data?.type === "login" && event.data?.session) {
          setSession(event.data.session as AuthSessionRecord);
          safeWriteStorage(event.data.session as AuthSessionRecord);
        }
      };
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) {
        return;
      }

      const nextSession = safeReadStorage();
      setSession(nextSession);
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      channelRef.current?.close();
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSession((current) => {
        if (!current) {
          return current;
        }

        if (new Date(current.expiresAt).getTime() <= Date.now()) {
          safeWriteStorage(null);
          channelRef.current?.postMessage({ type: "logout" });
          return null;
        }

        return current;
      });
    }, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      login: (nextSession) => {
        setSession(nextSession);
        safeWriteStorage(nextSession);
        channelRef.current?.postMessage({ type: "login", session: nextSession });
      },
      logout: () => {
        setSession(null);
        safeWriteStorage(null);
        channelRef.current?.postMessage({ type: "logout" });
      },
      refreshSessionExpiry: (expiresAt) => {
        setSession((current) => {
          if (!current) {
            return current;
          }

          const next = {
            ...current,
            expiresAt
          };

          safeWriteStorage(next);
          return next;
        });
      }
    }),
    [session]
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

function useAuthSession() {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error("useAuthSession must be used within AuthSessionProvider");
  }

  return context;
}

export { AuthSessionProvider, useAuthSession };
export type { AuthSessionRecord, AuthSessionUser };
