"use client";

import { useEffect, useState } from "react";
import {
  ensureSessionRoleFetched,
  getCachedSessionRole,
  subscribeSessionRoleCache,
  type SessionRole,
} from "@/lib/session-role-cache";

export type { SessionRole };

/**
 * Shared session role + derived listing links for desktop and mobile nav (single shared fetch).
 */
export function useSessionRoleNav() {
  const [role, setRole] = useState<SessionRole>(() => getCachedSessionRole());

  useEffect(() => {
    function applyCacheFromFetch() {
      void ensureSessionRoleFetched().then(() => {
        const c = getCachedSessionRole();
        setRole(c === undefined ? null : c);
      });
    }

    applyCacheFromFetch();
    const unsubscribe = subscribeSessionRoleCache(applyCacheFromFetch);
    return unsubscribe;
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
