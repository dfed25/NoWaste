"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { hasSeenOnboarding } from "@/lib/onboarding-storage";

/**
 * First app open: send anonymous users to role selection before the marketplace home.
 */
export function FirstVisitRedirect() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (pathname !== "/" || isLoading) return;
    if (user) return;
    if (hasSeenOnboarding()) return;
    router.replace("/get-started");
  }, [pathname, user, isLoading, router]);

  return null;
}
