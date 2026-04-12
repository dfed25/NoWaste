"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { useSessionRoleNav } from "@/hooks/use-session-role-nav";

/**
 * Sends customers with incomplete name/phone to onboarding so checkout can prefill from profile.
 * Does not render children until the profile check finishes (or is skipped for non-customers).
 */
export function CustomerProfileGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { roleResolved, isCustomer } = useSessionRoleNav();
  const [profileGateReady, setProfileGateReady] = useState(false);

  useEffect(() => {
    if (authLoading || !roleResolved) return;

    if (!user || !isCustomer) {
      setProfileGateReady(true);
      return;
    }

    let cancelled = false;

    async function run() {
      try {
        const res = await fetch("/api/account/me", { credentials: "include", cache: "no-store" });
        const data = (await res.json()) as {
          profile?: { displayName?: string; phone?: string };
        };
        if (cancelled) return;

        if (!res.ok) {
          router.replace("/onboarding/customer");
          return;
        }

        const p = data.profile;
        if (!p?.displayName?.trim() || !p?.phone?.trim()) {
          router.replace("/onboarding/customer");
        }
      } catch {
        if (!cancelled) {
          router.replace("/onboarding/customer");
        }
      } finally {
        if (!cancelled) {
          setProfileGateReady(true);
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isCustomer, roleResolved, router, user]);

  if (authLoading || !roleResolved) {
    return (
      <div className="py-16 text-center text-sm text-neutral-500" role="status" aria-live="polite">
        Loading…
      </div>
    );
  }

  if (user && isCustomer && !profileGateReady) {
    return (
      <div className="py-16 text-center text-sm text-neutral-500" role="status" aria-live="polite">
        Loading your profile…
      </div>
    );
  }

  return <>{children}</>;
}
