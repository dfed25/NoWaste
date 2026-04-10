"use client";

import type { AppRole } from "@/lib/admin";
import { serializeRoleCookie } from "@/lib/admin";
import { invalidateSessionRoleCache } from "@/lib/session-role-cache";

export type SyncNwSessionOptions = {
  /** Used when the server cannot mint a signed staff session (e.g. missing restaurant_id). */
  fallbackRole?: AppRole;
  /** When aborted, the fetch is cancelled and no cookies or cache updates are applied. */
  signal?: AbortSignal;
};

/**
 * Issues signed `nw-*` cookies from a Supabase access token. Call after login and on session refresh.
 */
function isAbortError(e: unknown): boolean {
  return (
    (e instanceof DOMException && e.name === "AbortError") ||
    (typeof e === "object" &&
      e !== null &&
      "name" in e &&
      (e as { name?: string }).name === "AbortError")
  );
}

export async function syncNwSessionFromAccessToken(
  accessToken: string,
  options?: SyncNwSessionOptions,
): Promise<{ ok: boolean; signed: boolean }> {
  const signal = options?.signal;
  try {
    const res = await fetch("/api/auth/sync-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ access_token: accessToken }),
      signal,
    });

    if (signal?.aborted) {
      return { ok: false, signed: false };
    }

    let signed = false;
    try {
      const body = (await res.json()) as { signed?: boolean };
      signed = body.signed === true;
    } catch {
      /* ignore */
    }

    if (signal?.aborted) {
      return { ok: false, signed: false };
    }

    if (res.ok && !signed && options?.fallbackRole) {
      const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
      document.cookie = serializeRoleCookie(options.fallbackRole, isSecure);
    }

    if (res.ok) {
      invalidateSessionRoleCache();
    }
    return { ok: res.ok, signed };
  } catch (e) {
    if (signal?.aborted || isAbortError(e)) {
      return { ok: false, signed: false };
    }
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
