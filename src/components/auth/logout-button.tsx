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
      disabled={isLoading}
      onClick={async () => {
        setIsLoading(true);
        await signOut();
        pushToast({ tone: "info", title: "Logged out" });
        router.push("/auth/login");
        router.refresh();
      }}
    >
      {isLoading ? "Logging out..." : "Logout"}
    </Button>
  );
}

