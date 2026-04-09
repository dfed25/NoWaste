"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { syncNwSessionFromAccessToken } from "@/lib/auth/sync-nw-session-client";
import { CUSTOMER_ID_COOKIE_NAME } from "@/lib/auth-cookies";
import { normalizeRole, type AppRole } from "@/lib/admin";
import {
  AUTH_COOKIE_NAME,
  getSupabaseBrowserClient,
} from "@/lib/supabase/client";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function fallbackRoleFromUser(user: User | undefined): AppRole {
  const meta = user?.user_metadata;
  return (
    normalizeRole(meta?.app_role as string | undefined) ??
    normalizeRole(meta?.role as string | undefined) ??
    ("customer" as AppRole)
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let supabase;
    let mounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    try {
      supabase = getSupabaseBrowserClient();
    } catch {
      setSession(null);
      setIsLoading(false);
      syncAuthCookies(null);
      return () => {
        mounted = false;
      };
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setIsLoading(false);
      syncAuthCookies(data.session);
      if (data.session?.access_token) {
        const fallback = fallbackRoleFromUser(data.session.user);
        void syncNwSessionFromAccessToken(data.session.access_token, { fallbackRole: fallback });
      }
    });

    ({
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      syncAuthCookies(nextSession);
      if (nextSession?.access_token) {
        const fallback = fallbackRoleFromUser(nextSession.user);
        void syncNwSessionFromAccessToken(nextSession.access_token, { fallbackRole: fallback });
      }
    }));

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      isLoading,
      signOut: async () => {
        try {
          const supabase = getSupabaseBrowserClient();
          await supabase.auth.signOut();
        } finally {
          setSession(null);
          syncAuthCookies(null);
        }
      },
    }),
    [isLoading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

function syncAuthCookies(session: Session | null) {
  if (typeof document === "undefined") return;

  if (session) {
    document.cookie = `${AUTH_COOKIE_NAME}=1; Path=/; Max-Age=604800; SameSite=Lax`;
    document.cookie = `${CUSTOMER_ID_COOKIE_NAME}=${encodeURIComponent(session.user.id)}; Path=/; Max-Age=604800; SameSite=Lax`;
  } else {
    document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
    document.cookie = `${CUSTOMER_ID_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
  }
}
