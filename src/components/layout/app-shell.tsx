import type { ReactNode } from "react";
import Link from "next/link";
import { AuthNavActions } from "@/components/auth/auth-nav-actions";
import { MobileNav } from "@/components/navigation/mobile-nav";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="text-sm font-semibold tracking-tight text-brand-700">
            NoWaste
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-neutral-600 md:flex">
            <Link href="/dashboard" className="hover:text-neutral-900">
              Dashboard
            </Link>
            <Link href="/listings" className="hover:text-neutral-900">
              Listings
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
          <div className="hidden md:block">
            <AuthNavActions />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-28 md:px-6 md:pb-8">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
