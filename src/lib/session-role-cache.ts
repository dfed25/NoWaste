"use client";

export type SessionRole = "customer" | "restaurant_staff" | "admin" | null | undefined;

/** `undefined` = fetch not finished; thereafter `null` or a concrete role. */
let cachedResolved: SessionRole | null | undefined = undefined;
let inFlight: Promise<void> | null = null;

function parsePayload(
  payload: { authenticated?: boolean; role?: string | null } | null,
): SessionRole | null {
  if (!payload) return null;
  if (payload.authenticated === false) return null;
  const r = payload.role;
  if (r === "customer" || r === "restaurant_staff" || r === "admin") return r;
  if (payload.authenticated === true) return null;
  return null;
}

/** Clears the module cache so the next hook mount refetches (e.g. after login / sync-session). */
export function invalidateSessionRoleCache(): void {
  cachedResolved = undefined;
  inFlight = null;
}

/** One shared request per page load; all consumers reuse the same result. */
export function ensureSessionRoleFetched(): Promise<void> {
  if (cachedResolved !== undefined) {
    return Promise.resolve();
  }
  if (!inFlight) {
    inFlight = fetch("/api/auth/session-summary", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { authenticated?: boolean; role?: string | null } | null) => {
        cachedResolved = parsePayload(payload);
      })
      .catch(() => {
        cachedResolved = null;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

export function getCachedSessionRole(): SessionRole | null | undefined {
  return cachedResolved;
}
