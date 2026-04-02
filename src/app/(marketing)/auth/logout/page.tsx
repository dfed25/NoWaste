"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/feedback/toast-provider";
import { useAuth } from "@/components/auth/auth-provider";

export default function LogoutPage() {
  const router = useRouter();
  const { pushToast } = useToast();
  const { signOut } = useAuth();

  useEffect(() => {
    void (async () => {
      await signOut();
      pushToast({ tone: "info", title: "Logged out" });
      router.replace("/auth/login");
      router.refresh();
    })();
  }, [pushToast, router, signOut]);

  return <p className="text-body-sm text-neutral-600">Signing you out...</p>;
}

