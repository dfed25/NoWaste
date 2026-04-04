"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SessionRole = "customer" | "restaurant_staff" | "admin" | null;

export function PrimaryNavLinks() {
  const [role, setRole] = useState<SessionRole | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session-summary", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { role?: string | null } | null) => {
        if (cancelled || !payload?.role) {
          if (!cancelled) setRole((payload?.role as SessionRole) ?? null);
          return;
        }
        const r = payload.role;
        if (r === "customer" || r === "restaurant_staff" || r === "admin") {
          setRole(r);
        } else {
          setRole(null);
        }
      })
      .catch(() => {
        if (!cancelled) setRole(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isStaff = role === "restaurant_staff" || role === "admin";
  const listingsHref = isStaff ? "/listings" : "/";
  const listingsLabel = isStaff ? "My listings" : "Browse";

  return (
    <nav className="hidden min-w-0 flex-1 items-center justify-center gap-5 text-sm text-neutral-600 md:flex">
      <Link href="/dashboard" className="hover:text-neutral-900">
        Dashboard
      </Link>
      <Link href={listingsHref} className="hover:text-neutral-900">
        {listingsLabel}
      </Link>
      <Link href="/reservations" className="hover:text-neutral-900">
        Reservations
      </Link>
      <Link href="/orders" className="hover:text-neutral-900">
        Orders
      </Link>
      <Link href="/saved" className="hover:text-neutral-900">
        Saved
      </Link>
      <Link href="/notifications" className="hover:text-neutral-900">
        Notifications
      </Link>
      <Link href="/onboarding/restaurant" className="hover:text-neutral-900">
        Onboarding
      </Link>
    </nav>
  );
}
