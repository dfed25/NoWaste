"use client";

import { useEffect, useState } from "react";

export type SessionRole = "customer" | "restaurant_staff" | "admin" | null | undefined;

/**
 * Shared session role + derived listing links for desktop and mobile nav (single fetch).
 */
export function useSessionRoleNav() {
  const [role, setRole] = useState<SessionRole>(undefined);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/session-summary", { credentials: "include", signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { role?: string | null } | null) => {
        if (controller.signal.aborted) return;
        if (!payload) {
          setRole(null);
          return;
        }
        const r = payload.role;
        if (r === "customer" || r === "restaurant_staff" || r === "admin") {
          setRole(r);
        } else {
          setRole(null);
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof DOMException && error.name === "AbortError") return;
        setRole(null);
      });
    return () => controller.abort();
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
