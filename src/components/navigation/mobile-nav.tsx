"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useSessionRoleNav } from "@/hooks/use-session-role-nav";
import { cn } from "@/lib/cn";
import {
  NavIconBell,
  NavIconGrid,
  NavIconHome,
  NavIconOrders,
  NavIconPlaceholder,
  NavIconQueue,
  NavIconSaved,
  NavIconUser,
} from "@/components/navigation/nav-tab-icons";

type Glyph = "home" | "saved" | "orders" | "notifications" | "account" | "browse" | "queue";

function NavGlyph({ glyph, className }: { glyph: Glyph; className?: string }) {
  switch (glyph) {
    case "home":
      return <NavIconHome className={className} />;
    case "saved":
      return <NavIconSaved className={className} />;
    case "orders":
      return <NavIconOrders className={className} />;
    case "notifications":
      return <NavIconBell className={className} />;
    case "account":
      return <NavIconUser className={className} />;
    case "browse":
      return <NavIconGrid className={className} />;
    case "queue":
      return <NavIconQueue className={className} />;
    default:
      return <NavIconPlaceholder className={className} />;
  }
}

const baseNavItems = [
  { href: "/", label: "Home", glyph: "home" as const, key: "home" },
  { href: "/saved", label: "Saved", glyph: "saved" as const, key: "saved" },
  { href: "/orders", label: "Orders", glyph: "orders" as const, key: "orders" },
  { href: "/notifications", label: "Alerts", glyph: "notifications" as const, key: "notifications" },
  { href: "/account/settings", label: "Account", glyph: "account" as const, key: "account" },
] as const;

type MobileNavItem = {
  href: string;
  label: string;
  glyph: Glyph;
  key: string;
  pending?: boolean;
};

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Role-agnostic skeleton: same tabs customers see, no transient staff-only slots. */
function loadingPlaceholderItems(): MobileNavItem[] {
  return baseNavItems.map((item) => ({ ...item, pending: true }));
}

export function MobileNav() {
  const pathname = usePathname();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const { roleResolved, isStaff, listingsHref, listingsLabelMobile } = useSessionRoleNav();

  useEffect(() => {
    let mounted = true;
    let isFetching = false;
    let activeController: AbortController | null = null;

    async function loadUnreadCount() {
      if (isFetching) return;
      isFetching = true;
      const controller = new AbortController();
      activeController = controller;
      const timeoutId = window.setTimeout(() => controller.abort(), 10_000);
      try {
        const response = await fetch("/api/notifications/me", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) return;
        const payload = (await response.json()) as { unreadCount?: number };
        if (!mounted) return;
        setUnreadNotifications(
          typeof payload.unreadCount === "number" ? payload.unreadCount : 0,
        );
      } catch (error) {
        if (!mounted) return;
        if (error instanceof DOMException && error.name === "AbortError") return;
        /* Transient failures: keep last known unread count */
      } finally {
        window.clearTimeout(timeoutId);
        if (activeController === controller) {
          activeController = null;
        }
        isFetching = false;
      }
    }

    void loadUnreadCount();
    const interval = window.setInterval(() => void loadUnreadCount(), 30_000);
    return () => {
      mounted = false;
      activeController?.abort();
      window.clearInterval(interval);
    };
  }, []);

  const navItems = useMemo((): MobileNavItem[] => {
    if (!roleResolved) {
      return loadingPlaceholderItems();
    }

    const showBrowseTab = isStaff && listingsHref !== "/";
    const showQueue = isStaff;

    const core: MobileNavItem[] = [{ ...baseNavItems[0] }];

    if (showBrowseTab) {
      core.push({
        href: listingsHref,
        label: listingsLabelMobile,
        glyph: "browse",
        key: "browse",
      });
    }

    core.push({ ...baseNavItems[1] }, { ...baseNavItems[2] });

    if (showQueue) {
      core.push({
        href: "/reservations",
        label: "Queue",
        glyph: "queue",
        key: "reservations",
      });
    }

    core.push({ ...baseNavItems[3] }, { ...baseNavItems[4] });

    return core;
  }, [isStaff, listingsHref, listingsLabelMobile, roleResolved]);

  const linkClass = (isActive: boolean) =>
    cn(
      "relative flex h-[3.25rem] flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-medium leading-tight transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
      isActive
        ? "bg-brand-100/80 text-brand-800"
        : "text-neutral-500 hover:bg-neutral-100/90 hover:text-neutral-800",
    );

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200/90 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label="Mobile primary navigation"
      aria-busy={!roleResolved || undefined}
    >
      {!roleResolved ? (
        <span className="sr-only">Loading navigation tabs</span>
      ) : null}
      <ul className="mx-auto flex max-w-lg snap-x snap-mandatory gap-0.5 overflow-x-auto px-3 py-1.5 [scrollbar-width:thin] [scrollbar-color:rgb(203_213_225)_transparent]">
        {navItems.map((item) => {
          const isActive = !item.pending && isActivePath(pathname, item.href);
          const showUnreadBadge = item.href === "/notifications" && unreadNotifications > 0;
          return (
            <li key={item.key} className="min-w-[3.75rem] flex-1 snap-start">
              {item.pending ? (
                <span
                  className={cn(linkClass(false), "cursor-wait text-neutral-400 hover:bg-transparent")}
                  aria-hidden="true"
                >
                  <NavGlyph glyph={item.glyph} className="opacity-40" />
                  <span className="text-neutral-400">{item.label}</span>
                </span>
              ) : (
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={linkClass(isActive)}
                >
                  <NavGlyph glyph={item.glyph} className={isActive ? "text-brand-700" : undefined} />
                  <span>{item.label}</span>
                  {showUnreadBadge ? (
                    <span className="absolute right-1 top-1 min-w-4 rounded-full bg-brand-600 px-1 text-center text-[10px] font-semibold text-white">
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
