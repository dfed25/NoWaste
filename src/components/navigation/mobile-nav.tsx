"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useSessionRoleNav } from "@/hooks/use-session-role-nav";
import { cn } from "@/lib/cn";

const baseNavItems = [
  { href: "/", label: "Home", icon: "🏠", key: "home" },
  { href: "/saved", label: "Saved", icon: "⭐", key: "saved" },
  { href: "/orders", label: "Orders", icon: "🧾", key: "orders" },
  { href: "/notifications", label: "Alerts", icon: "🔔", key: "notifications" },
  { href: "/account/settings", label: "Account", icon: "👤", key: "account" },
] as const;

type MobileNavItem = {
  href: string;
  label: string;
  icon: string;
  key: string;
  pending?: boolean;
};

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Same tab count/order as resolved staff nav, non-interactive while role is loading. */
function staffLoadingPlaceholderItems(): MobileNavItem[] {
  return [
    { ...baseNavItems[0], pending: true },
    { href: "/listings", label: "…", icon: "⏳", key: "browse", pending: true },
    { ...baseNavItems[1], pending: true },
    { ...baseNavItems[2], pending: true },
    { href: "/reservations", label: "…", icon: "⏳", key: "reservations", pending: true },
    { ...baseNavItems[3], pending: true },
    { ...baseNavItems[4], pending: true },
  ];
}

export function MobileNav() {
  const pathname = usePathname();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const { roleResolved, isStaff, listingsHref, listingsLabelMobile } = useSessionRoleNav();

  useEffect(() => {
    let mounted = true;

    async function loadUnreadCount() {
      try {
        const response = await fetch("/api/notifications/me", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as { unreadCount?: number };
        if (!mounted) return;
        setUnreadNotifications(
          typeof payload.unreadCount === "number" ? payload.unreadCount : 0,
        );
      } catch {
        if (mounted) setUnreadNotifications(0);
      }
    }

    void loadUnreadCount();
    const interval = window.setInterval(loadUnreadCount, 30_000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const navItems = useMemo((): MobileNavItem[] => {
    if (!roleResolved) {
      return staffLoadingPlaceholderItems();
    }

    const showBrowseTab = isStaff && listingsHref !== "/";
    const showQueue = isStaff;

    const core: MobileNavItem[] = [{ ...baseNavItems[0] }];

    if (showBrowseTab) {
      core.push({
        href: listingsHref,
        label: listingsLabelMobile,
        icon: "🧺",
        key: "browse",
      });
    }

    core.push({ ...baseNavItems[1] }, { ...baseNavItems[2] });

    if (showQueue) {
      core.push({
        href: "/reservations",
        label: "Queue",
        icon: "📋",
        key: "reservations",
      });
    }

    core.push({ ...baseNavItems[3] }, { ...baseNavItems[4] });

    return core;
  }, [isStaff, listingsHref, listingsLabelMobile, roleResolved]);

  const linkClass = (isActive: boolean) =>
    cn(
      "relative flex h-[3.75rem] flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-medium leading-tight transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
      isActive
        ? "bg-brand-100/70 text-brand-700"
        : "text-neutral-500 hover:bg-neutral-100/80 hover:text-neutral-800",
    );

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label="Mobile primary navigation"
      aria-busy={!roleResolved || undefined}
    >
      {!roleResolved ? (
        <span className="sr-only">Loading navigation tabs</span>
      ) : null}
      <ul className="mx-auto flex max-w-xl snap-x snap-mandatory gap-0.5 overflow-x-auto px-2 py-1 [scrollbar-width:thin] [scrollbar-color:rgb(203_213_225)_transparent]">
        {navItems.map((item) => {
          const isActive = !item.pending && isActivePath(pathname, item.href);
          const showUnreadBadge = item.href === "/notifications" && unreadNotifications > 0;
          return (
            <li key={item.key} className="min-w-[4.25rem] flex-1 snap-start">
              {item.pending ? (
                <span
                  className={cn(linkClass(false), "cursor-wait text-neutral-400 hover:bg-transparent")}
                  aria-hidden="true"
                >
                  <span className="text-base leading-none">{item.icon}</span>
                  <span>{item.label}</span>
                </span>
              ) : (
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={linkClass(isActive)}
                >
                  <span className="text-base leading-none" aria-hidden>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {showUnreadBadge ? (
                    <span className="absolute right-1 top-1.5 min-w-4 rounded-full bg-brand-600 px-1 text-center text-[10px] font-semibold text-white">
                      {unreadNotifications > 9 ? "9+" : unreadNotifications}
                    </span>
                  ) : null}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
