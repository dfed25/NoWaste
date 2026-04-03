"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { LogoutButton } from "@/components/auth/logout-button";

export function AuthNavActions() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <span className="text-[11px] text-neutral-500 md:text-xs">…</span>;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-1.5 md:gap-2">
        <Link
          href="/auth/login"
          className="text-xs font-medium text-neutral-700 hover:text-neutral-900 md:text-sm"
        >
          Log in
        </Link>
        <Link
          href="/auth/sign-up"
          className="rounded-lg bg-brand-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-brand-700 md:px-2.5 md:py-1.5 md:text-xs"
        >
          <span className="md:hidden">Join</span>
          <span className="hidden md:inline">Sign up</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 md:gap-2">
      <Link
        href="/account/settings"
        className="max-w-[4.5rem] truncate text-xs font-medium text-neutral-700 hover:text-neutral-900 md:max-w-none md:text-sm"
      >
        Account
      </Link>
      <LogoutButton />
    </div>
  );
}

