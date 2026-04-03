"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/feedback/toast-provider";
import { useAuth } from "@/components/auth/auth-provider";

type LogoutButtonProps = {
  compact?: boolean;
};

export function LogoutButton({ compact }: LogoutButtonProps) {
  const router = useRouter();
  const { pushToast } = useToast();
  const { signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Button
      variant="ghost"
      size="sm"
      className={compact ? "h-8 px-1.5 text-xs" : undefined}
      disabled={isLoading}
      onClick={async () => {
        setIsLoading(true);
        await signOut();
        pushToast({ tone: "info", title: "Logged out" });
        router.push("/auth/login");
        router.refresh();
      }}
    >
      {isLoading ? (compact ? "…" : "Logging out...") : "Logout"}
    </Button>
  );
}

