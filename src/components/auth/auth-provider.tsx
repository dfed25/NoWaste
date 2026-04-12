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
import {
  clearNwSessionCookies,
  syncNwSessionFromAccessToken,
} from "@/lib/auth/sync-nw-session-client";
import { normalizeRole, type AppRole } from "@/lib/admin";
import { CUSTOMER_ID_COOKIE_NAME } from "@/lib/auth-cookies";
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

/** Token that should own signed nw-* cookies; late responses compare against this. */
let nwSyncAuthoritativeToken: string | null = null;
let nwSyncActiveController: AbortController | null = null;

function abortNwSessionSyncInFlight(): void {
  nwSyncActiveController?.abort();
  nwSyncActiveController = null;
}

function fallbackRoleFromUser(user: User | undefined): AppRole {
  const meta = user?.user_metadata;
  return (
    normalizeRole(meta?.app_role as string | undefined) ??
    normalizeRole(meta?.role as string | undefined) ??
    ("customer" as AppRole)
  );
}

function syncNwSessionFor(
  session: Session | null,
  opts?: { signal?: AbortSignal },
): Promise<{ ok: boolean; signed: boolean }> {
  if (!session?.access_token) {
    return Promise.resolve({ ok: false, signed: false });
  }
  const fallback = fallbackRoleFromUser(session.user);
  return syncNwSessionFromAccessToken(session.access_token, {
    fallbackRole: fallback,
    signal: opts?.signal,
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let supabase;
    let mounted = true;
    let subscription: { unsubscribe: () => void } | null = null;
    /** Set only after `/api/auth/sync-session` succeeds so a failed sync can retry on the next event. */
    let lastSyncedAccessToken: string | null = null;
    /** Suppresses duplicate POSTs for the same JWT while a sync is in flight. */
    const syncInflight = new Set<string>();

    function syncNwSessionIfNeeded(next: Session | null): void {
      const token = next?.access_token ?? null;
      nwSyncAuthoritativeToken = token;

      if (!token) {
        lastSyncedAccessToken = null;
        syncInflight.clear();
        abortNwSessionSyncInFlight();
        void clearNwSessionCookies();
        return;
      }
      if (token === lastSyncedAccessToken) return;
      if (syncInflight.has(token)) return;

      abortNwSessionSyncInFlight();
      const controller = new AbortController();
      nwSyncActiveController = controller;
      syncInflight.add(token);

      void syncNwSessionFor(next, { signal: controller.signal })
        .then((result) => {
          syncInflight.delete(token);
          if (!mounted) return;
          if (nwSyncAuthoritativeToken !== token) return;
          if (controller.signal.aborted) return;
          if (result.ok) {
            lastSyncedAccessToken = token;
          }
        })
        .finally(() => {
          if (nwSyncActiveController === controller) {
            nwSyncActiveController = null;
          }
        });
    }

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

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session);
        syncAuthCookies(data.session);
        syncNwSessionIfNeeded(data.session);
      })
      .catch((err) => {
        console.error("[AuthProvider] getSession failed", err);
        if (!mounted) return;
        setSession(null);
        syncAuthCookies(null);
        syncNwSessionIfNeeded(null);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    ({
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      syncAuthCookies(nextSession);
      syncNwSessionIfNeeded(nextSession);
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
          nwSyncAuthoritativeToken = null;
          abortNwSessionSyncInFlight();
          setSession(null);
          syncAuthCookies(null);
          void clearNwSessionCookies();
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
    // `nw-user-id` is set as httpOnly + signed by POST /api/auth/sync-session (verified JWT).
  } else {
    document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
    document.cookie = `${CUSTOMER_ID_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
  }
}
