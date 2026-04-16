"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/feedback/toast-provider";
import type { RestaurantApplicationStatus } from "@/lib/restaurant-application-status";

type Row = {
  userId: string;
  email: string | undefined;
  restaurantId: string | undefined;
  businessLegalName: string | undefined;
  status: RestaurantApplicationStatus | null;
  createdAt: string | undefined;
};

export function RestaurantApplicationsAdmin() {
  const { pushToast } = useToast();
  const [pending, setPending] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/restaurant-applications", { credentials: "include" });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        pending?: Row[];
      };
      if (!res.ok) {
        pushToast({
          tone: "error",
          title: "Could not load applications",
          description: body.error ?? "Try again.",
        });
        return;
      }
      setPending(body.pending ?? []);
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(userId: string, action: "approve" | "reject" | "suspend") {
    setActing(userId);
    try {
      const res = await fetch("/api/admin/restaurant-applications", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        pushToast({
          tone: "error",
          title: "Update failed",
          description: body.error ?? "Could not update user.",
        });
        return;
      }
      pushToast({
        tone: "success",
        title: action === "approve" ? "Approved" : action === "reject" ? "Rejected" : "Suspended",
        description: "User metadata updated. Ask them to refresh the session or sign in again.",
      });
      await load();
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-2 p-5">
        <h2 className="text-title-md text-neutral-900">Pending review</h2>
        <p className="text-sm text-neutral-600">
          Approve only after you are satisfied the business is legitimate (manual review MVP). Staff must
          refresh or re-authenticate to pick up new signed cookies.
        </p>
      </Card>

      {loading ? (
        <p className="text-sm text-neutral-600">Loading…</p>
      ) : pending.length === 0 ? (
        <Card className="p-5 text-sm text-neutral-600">No restaurants are waiting in the queue.</Card>
      ) : (
        <ul className="space-y-3">
          {pending.map((row) => (
            <li key={row.userId}>
              <Card className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-neutral-900">
                    {row.businessLegalName ?? "Unknown business"}
                  </p>
                  <p className="text-neutral-600">{row.email}</p>
                  <p className="text-xs text-neutral-500">
                    Status: {row.status ?? "unknown"} · Restaurant id: {row.restaurantId ?? "—"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={acting !== null}
                    onClick={() => void act(row.userId, "approve")}
                  >
                    {acting === row.userId ? "…" : "Approve"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={acting !== null}
                    onClick={() => void act(row.userId, "reject")}
                  >
                    Reject
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    disabled={acting !== null}
                    onClick={() => void act(row.userId, "suspend")}
                  >
                    Suspend
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
