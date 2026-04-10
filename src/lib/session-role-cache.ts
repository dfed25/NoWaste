"use client";

export type SessionRole = "customer" | "restaurant_staff" | "admin" | null | undefined;

/** `undefined` = fetch not finished; thereafter `null` or a concrete role. */
let cachedResolved: SessionRole | null | undefined = undefined;
let inFlight: Promise<void> | null = null;
let cacheVersion = 0;

const listeners = new Set<() => void>();

function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}

/** Subscribe to cache changes (invalidation + fetch completion). */
export function subscribeSessionRoleCache(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

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
  cacheVersion += 1;
  cachedResolved = undefined;
  inFlight = null;
  notifyListeners();
}

/** One shared request per page load; all consumers reuse the same result. */
export function ensureSessionRoleFetched(): Promise<void> {
  if (cachedResolved !== undefined) {
    return Promise.resolve();
  }
  if (!inFlight) {
    const requestVersion = cacheVersion;
    const pending = fetch("/api/auth/session-summary", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { authenticated?: boolean; role?: string | null } | null) => {
        if (requestVersion !== cacheVersion) return;
        cachedResolved = parsePayload(payload);
        notifyListeners();
      })
      .catch(() => {
        if (requestVersion !== cacheVersion) return;
        cachedResolved = undefined;
      })
      .finally(() => {
        if (inFlight === pending) {
          inFlight = null;
        }
      });
    inFlight = pending;
  }
  return inFlight;
}

export function getCachedSessionRole(): SessionRole | null | undefined {
  return cachedResolved;
}
