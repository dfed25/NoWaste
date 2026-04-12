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
    <div className="min-h-screen min-w-0 max-w-[100vw] overflow-x-hidden bg-neutral-50 text-neutral-900">
      <header className="sticky top-0 z-30 border-b border-neutral-200/90 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-12 w-full max-w-5xl items-center gap-3 px-4 md:h-14 md:gap-5 md:px-6">
          <Link
            href="/"
            className="shrink-0 text-[15px] font-semibold tracking-tight text-brand-700 md:text-base"
          >
            NoWaste
          </Link>
          <PrimaryNavLinks />
          <div className="ml-auto shrink-0 md:ml-0">
            <AuthNavActions />
          </div>
        </div>
      </header>
      <main className="mx-auto min-w-0 w-full max-w-5xl overflow-x-hidden px-4 py-5 pb-24 md:px-6 md:py-7 md:pb-10">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
