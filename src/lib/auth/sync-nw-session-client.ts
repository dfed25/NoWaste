"use client";

import type { AppRole } from "@/lib/admin";
import { serializeRoleCookie } from "@/lib/admin";
import { invalidateSessionRoleCache } from "@/lib/session-role-cache";

export type SyncNwSessionOptions = {
  /** Used when the server cannot mint a signed staff session (e.g. missing restaurant_id). */
  fallbackRole?: AppRole;
};

/**
 * Issues signed `nw-*` cookies from a Supabase access token. Call after login and on session refresh.
 */
export async function syncNwSessionFromAccessToken(
  accessToken: string,
  options?: SyncNwSessionOptions,
): Promise<{ ok: boolean; signed: boolean }> {
  try {
    const res = await fetch("/api/auth/sync-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ access_token: accessToken }),
    });
    let signed = false;
    try {
      const body = (await res.json()) as { signed?: boolean };
      signed = body.signed === true;
    } catch {
      /* ignore */
    }

    if (res.ok && !signed && options?.fallbackRole) {
      const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
      document.cookie = serializeRoleCookie(options.fallbackRole, isSecure);
    }

    if (res.ok) {
      invalidateSessionRoleCache();
    }
    return { ok: res.ok, signed };
  } catch {
    return { ok: false, signed: false };
  }
}

/** Clears httpOnly `nw-*` cookies via the server; call when the Supabase session is gone. */
export async function clearNwSessionCookies(): Promise<void> {
  try {
    const res = await fetch("/api/auth/clear-nw-session", {
      method: "POST",
      credentials: "include",
    });
    if (res.ok) {
      invalidateSessionRoleCache();
    }
  } catch {
    /* ignore */
  }
}
