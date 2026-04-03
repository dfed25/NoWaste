"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/states/empty-state";

type InboxNotification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  readAt?: string;
  linkHref?: string;
};

type FilterMode = "all" | "unread";

export function NotificationsCenter() {
  const [notifications, setNotifications] = useState<InboxNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMode>("all");

  async function refreshNotifications() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/notifications/me", { cache: "no-store" });
      const payload = (await response.json()) as {
        notifications?: InboxNotification[];
        unreadCount?: number;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not load notifications");
      }

      setNotifications(Array.isArray(payload.notifications) ? payload.notifications : []);
      setUnreadCount(typeof payload.unreadCount === "number" ? payload.unreadCount : 0);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load notifications");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refreshNotifications();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((item) => !item.readAt);
    }
    return notifications;
  }, [filter, notifications]);

  async function markAsRead(notificationId: string) {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/notifications/me", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ notificationId }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Could not update notification");
      }

      await refreshNotifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update notification");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function markAllRead() {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/notifications/me", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ markAll: true }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Could not mark notifications as read");
      }

      await refreshNotifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update notifications");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <Card className="space-y-2 border-neutral-200/80">
        <p className="text-sm text-neutral-600">Loading your notifications...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="space-y-2 border-red-200 bg-red-50 text-red-800">
        <p className="text-sm font-medium">Notifications unavailable.</p>
        <p className="text-sm">{error}</p>
      </Card>
    );
  }

  if (notifications.length === 0) {
    return (
      <EmptyState
        title="You are all caught up"
        description="New reservation and pickup updates will appear here."
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center justify-between gap-3 border-neutral-200/80">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={filter === "all" ? "primary" : "secondary"}
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            type="button"
            size="sm"
            variant={filter === "unread" ? "primary" : "secondary"}
            onClick={() => setFilter("unread")}
          >
            Unread
          </Button>
          <Badge variant="brand">{unreadCount} unread</Badge>
        </div>

        <Button type="button" size="sm" variant="ghost" onClick={markAllRead} disabled={isSubmitting}>
          Mark all read
        </Button>
      </Card>

      <div className="space-y-3">
        {filtered.map((item) => {
          const isUnread = !item.readAt;
          return (
            <Card key={item.id} className="space-y-2 border-neutral-200/80">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900">{item.title}</h3>
                  <p className="text-xs text-neutral-500">
                    {new Date(item.createdAt).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <Badge variant={isUnread ? "brand" : "neutral"}>{isUnread ? "Unread" : "Read"}</Badge>
              </div>

              <p className="text-sm text-neutral-700">{item.message}</p>

              <div className="flex flex-wrap gap-2">
                {item.linkHref ? (
                  <Link
                    href={item.linkHref}
                    className="inline-flex h-9 items-center justify-center rounded-xl bg-neutral-100 px-3 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-200"
                  >
                    Open
                  </Link>
                ) : null}

                {isUnread ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => markAsRead(item.id)}
                    disabled={isSubmitting}
                  >
                    Mark read
                  </Button>
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
