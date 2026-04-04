"use client";

import Link from "next/link";
import { useSessionRoleNav } from "@/hooks/use-session-role-nav";

export function PrimaryNavLinks() {
  const { roleResolved, isCustomer, listingsHref, listingsLabelDesktop } = useSessionRoleNav();

  if (!roleResolved) {
    return (
      <nav
        className="hidden min-h-5 min-w-0 flex-1 items-center justify-center gap-5 text-sm text-neutral-400 md:flex"
        aria-busy="true"
        aria-label="Loading navigation"
      >
        <span className="select-none">…</span>
      </nav>
    );
  }

  return (
    <nav className="hidden min-w-0 flex-1 items-center justify-center gap-5 text-sm text-neutral-600 md:flex">
      {!isCustomer ? (
        <Link href="/dashboard" className="hover:text-neutral-900">
          Dashboard
        </Link>
      ) : null}
      <Link href={listingsHref} className="hover:text-neutral-900">
        {listingsLabelDesktop}
      </Link>
      {!isCustomer ? (
        <Link href="/reservations" className="hover:text-neutral-900">
          Reservations
        </Link>
      ) : null}
      <Link href="/orders" className="hover:text-neutral-900">
        Orders
      </Link>
      <Link href="/saved" className="hover:text-neutral-900">
        Saved
      </Link>
      <Link href="/notifications" className="hover:text-neutral-900">
        Notifications
      </Link>
      {!isCustomer ? (
        <Link href="/onboarding/restaurant" className="hover:text-neutral-900">
          Onboarding
        </Link>
      ) : null}
    </nav>
  );
}
