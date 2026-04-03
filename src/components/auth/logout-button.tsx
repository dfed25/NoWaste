"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/feedback/toast-provider";
import { useAuth } from "@/components/auth/auth-provider";

export function LogoutButton() {
  const router = useRouter();
  const { pushToast } = useToast();
  const { signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 px-1.5 text-xs md:h-9 md:px-3 md:text-sm"
      disabled={isLoading}
      onClick={async () => {
        setIsLoading(true);
        try {
          await signOut();
          pushToast({ tone: "info", title: "Logged out" });
          router.push("/auth/login");
          router.refresh();
        } catch {
          pushToast({
            tone: "error",
            title: "Could not log out. Please try again.",
          });
        } finally {
          setIsLoading(false);
        }
      }}
    >
      {isLoading ? (
        <>
          <span className="md:hidden">…</span>
          <span className="hidden md:inline">Logging out...</span>
        </>
      ) : (
        "Logout"
      )}
    </Button>
  );
}

