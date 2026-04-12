import type { ReactNode } from "react";
import Link from "next/link";
import { AuthNavActions } from "@/components/auth/auth-nav-actions";
import { MobileNav } from "@/components/navigation/mobile-nav";
import { PrimaryNavLinks } from "@/components/navigation/primary-nav-links";

type AppShellProps = {
  children: ReactNode;
};

/** Horizontal padding that respects notched devices and keeps content off screen edges. */
const shellPad =
  "pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]";

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen min-w-0 max-w-[100vw] flex-1 flex-col overflow-x-hidden bg-neutral-50 text-neutral-900">
      <header className="sticky top-0 z-30 border-b border-neutral-200/90 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div
          className={`mx-auto flex h-12 w-full min-w-0 max-w-6xl items-center gap-2 md:h-14 md:gap-4 lg:gap-5 ${shellPad}`}
        >
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
      <main
        className={`mx-auto flex min-h-0 min-w-0 w-full max-w-6xl flex-1 flex-col overflow-x-hidden py-6 pb-28 md:py-8 md:pb-12 ${shellPad}`}
      >
        <div className="w-full min-w-0 flex-1 space-y-6">{children}</div>
      </main>
      <MobileNav />
    </div>
  );
}
