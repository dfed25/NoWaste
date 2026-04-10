"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { useSessionRoleNav } from "@/hooks/use-session-role-nav";

/**
 * Sends customers with incomplete name/phone to onboarding so checkout can prefill from profile.
 */
export function CustomerProfileGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { roleResolved, isCustomer } = useSessionRoleNav();

  useEffect(() => {
    if (authLoading || !roleResolved || !user || !isCustomer) return;

    let cancelled = false;

    async function run() {
      try {
        const res = await fetch("/api/account/me", { credentials: "include", cache: "no-store" });
        const data = (await res.json()) as {
          profile?: { displayName?: string; phone?: string };
        };
        if (cancelled || !res.ok) return;
        const p = data.profile;
        if (!p?.displayName?.trim() || !p?.phone?.trim()) {
          router.replace("/onboarding/customer");
        }
      } catch {
        /* ignore */
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isCustomer, roleResolved, router, user]);

  return <>{children}</>;
}
