"use client";

import { useEffect, useState } from "react";

export type SessionRole = "customer" | "restaurant_staff" | "admin" | null | undefined;

/** `undefined` = fetch not finished; thereafter `null` or a concrete role. */
let cachedResolved: SessionRole | null | undefined = undefined;
let inFlight: Promise<void> | null = null;

function parsePayload(payload: { role?: string | null } | null): SessionRole | null {
  if (!payload) return null;
  const r = payload.role;
  if (r === "customer" || r === "restaurant_staff" || r === "admin") return r;
  return null;
}

/** One shared request per page load; all hook instances reuse the same result. */
function ensureSessionRoleFetched(): Promise<void> {
  if (cachedResolved !== undefined) {
    return Promise.resolve();
  }
  if (!inFlight) {
    inFlight = fetch("/api/auth/session-summary", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { role?: string | null } | null) => {
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

/**
 * Shared session role + derived listing links for desktop and mobile nav (single shared fetch).
 */
export function useSessionRoleNav() {
  const [role, setRole] = useState<SessionRole>(() =>
    cachedResolved !== undefined ? cachedResolved : undefined,
  );

  useEffect(() => {
    void ensureSessionRoleFetched().then(() => {
      setRole(cachedResolved === undefined ? null : cachedResolved);
    });
  }, []);

  const roleResolved = role !== undefined;
  const isStaff = role === "restaurant_staff" || role === "admin";
  const isCustomer = role === "customer";
  const listingsHref = isStaff ? "/listings" : "/";
  const listingsLabelDesktop = isStaff ? "My listings" : "Browse";
  const listingsLabelMobile = isStaff ? "Hub" : "Browse";

  return {
    role,
    roleResolved,
    isStaff,
    isCustomer,
    listingsHref,
    listingsLabelDesktop,
    listingsLabelMobile,
  };
}
