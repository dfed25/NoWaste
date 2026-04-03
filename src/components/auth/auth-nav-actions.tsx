"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { LogoutButton } from "@/components/auth/logout-button";
import { cn } from "@/lib/cn";

type AuthNavActionsProps = {
  /** Tighter header layout on small screens (e.g. next to the logo). */
  compact?: boolean;
};

export function AuthNavActions({ compact }: AuthNavActionsProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <span className={cn("text-neutral-500", compact ? "text-[11px]" : "text-xs")}>
        …
      </span>
    );
  }

  if (!user) {
    return (
      <div className={cn("flex items-center", compact ? "gap-1.5" : "gap-2")}>
        <Link
          href="/auth/login"
          className={cn(
            "font-medium text-neutral-700 hover:text-neutral-900",
            compact ? "text-xs" : "text-sm",
          )}
        >
          Log in
        </Link>
        <Link
          href="/auth/sign-up"
          className={cn(
            "rounded-lg bg-brand-600 font-medium text-white hover:bg-brand-700",
            compact ? "px-2 py-1 text-[11px]" : "px-2.5 py-1.5 text-xs",
          )}
        >
          {compact ? "Join" : "Sign up"}
        </Link>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", compact ? "gap-1" : "gap-2")}>
      <Link
        href="/account/settings"
        className={cn(
          "font-medium text-neutral-700 hover:text-neutral-900",
          compact ? "max-w-[4.5rem] truncate text-xs" : "text-sm",
        )}
      >
        Account
      </Link>
      <LogoutButton compact={compact} />
    </div>
  );
}

