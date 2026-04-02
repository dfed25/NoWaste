"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { LogoutButton } from "@/components/auth/logout-button";

export function AuthNavActions() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <span className="text-xs text-neutral-500">Checking session...</span>;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/auth/login" className="text-sm text-neutral-700 hover:text-neutral-900">
          Log in
        </Link>
        <Link
          href="/auth/sign-up"
          className="rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
        >
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/account/settings" className="text-sm text-neutral-700 hover:text-neutral-900">
        Account
      </Link>
      <LogoutButton />
    </div>
  );
}

