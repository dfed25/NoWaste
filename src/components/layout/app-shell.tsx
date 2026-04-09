import type { ReactNode } from "react";
import Link from "next/link";
import { AuthNavActions } from "@/components/auth/auth-nav-actions";
import { MobileNav } from "@/components/navigation/mobile-nav";
import { PrimaryNavLinks } from "@/components/navigation/primary-nav-links";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4 md:gap-4 md:px-6">
          <Link
            href="/"
            className="shrink-0 text-sm font-semibold tracking-tight text-brand-700"
          >
            NoWaste
          </Link>
          <PrimaryNavLinks />
          <div className="ml-auto shrink-0 md:ml-0">
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
