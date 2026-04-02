"use client";

import { Card } from "@/components/ui/card";
import { useAuth } from "@/components/auth/auth-provider";

export function SessionStatusCard() {
  const { user, session, isLoading } = useAuth();

  return (
    <Card variant="outlined" className="space-y-1">
      <h3 className="text-sm font-semibold text-neutral-900">Session status</h3>
      {isLoading ? (
        <p className="text-xs text-neutral-600">Loading session...</p>
      ) : user ? (
        <div className="text-xs text-neutral-700">
          <p>Authenticated: yes</p>
          <p>User: {user.email ?? user.id}</p>
          <p>Session: {session ? "active" : "missing"}</p>
        </div>
      ) : (
        <p className="text-xs text-neutral-600">Authenticated: no</p>
      )}
    </Card>
  );
}

