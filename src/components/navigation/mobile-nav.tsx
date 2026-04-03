"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const navItems = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/saved", label: "Saved", icon: "⭐" },
  { href: "/orders", label: "Orders", icon: "🧾" },
  { href: "/listings", label: "Browse", icon: "🧺" },
  { href: "/account/settings", label: "Account", icon: "👤" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label="Mobile primary navigation"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5 px-1">
        {navItems.map((item) => {
          const isActive = isActivePath(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
                  isActive
                    ? "bg-brand-100/70 text-brand-700"
                    : "text-neutral-500 hover:bg-neutral-100/80 hover:text-neutral-800",
                )}
              >
                <span className="text-base leading-none" aria-hidden>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
