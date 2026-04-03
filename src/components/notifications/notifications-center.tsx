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

type FilterMode = "all" | "unread" | "read";

type NotificationsPayload = {
  notifications?: InboxNotification[];
  unreadCount?: number;
  readCount?: number;
  totalCount?: number;
  error?: string;
};

export function NotificationsCenter() {
  const [notifications, setNotifications] = useState<InboxNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [readCount, setReadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [query, setQuery] = useState("");

  async function refreshNotifications() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/notifications/me", { cache: "no-store" });
      const payload = (await response.json()) as NotificationsPayload;

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not load notifications");
      }

      const items = Array.isArray(payload.notifications) ? payload.notifications : [];
      setNotifications(items);
      setUnreadCount(typeof payload.unreadCount === "number" ? payload.unreadCount : 0);
      setReadCount(typeof payload.readCount === "number" ? payload.readCount : 0);
      setTotalCount(typeof payload.totalCount === "number" ? payload.totalCount : items.length);
      setError(null);
      setMutationError(null);
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
    const lowered = query.trim().toLowerCase();

    return notifications
      .filter((item) => {
        if (filter === "unread") return !item.readAt;
        if (filter === "read") return Boolean(item.readAt);
        return true;
      })
      .filter((item) => {
        if (!lowered) return true;
        return (
          item.title.toLowerCase().includes(lowered) ||
          item.message.toLowerCase().includes(lowered)
        );
      });
  }, [filter, notifications, query]);

  async function mutateNotifications(body: Record<string, unknown>) {
    setIsSubmitting(true);
    setMutationError(null);

    try {
      const response = await fetch("/api/notifications/me", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };

        // Stale item actions can legitimately return 404 from another tab/session.
        if (response.status === 404) {
          await refreshNotifications();
          return;
        }

        setMutationError(payload.error ?? "Could not update notifications");
        return;
      }

      await refreshNotifications();
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : "Could not update notifications");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <Card className="space-y-2 border-neutral-200/80" role="status" aria-live="polite">
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
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-neutral-200/80 bg-gradient-to-br from-white to-brand-100/30">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Total</p>
          <p className="mt-1 text-lg font-semibold text-neutral-900">{totalCount}</p>
        </Card>
        <Card className="border-neutral-200/80">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Unread</p>
          <p className="mt-1 text-lg font-semibold text-brand-700">{unreadCount}</p>
        </Card>
        <Card className="border-neutral-200/80">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Read</p>
          <p className="mt-1 text-lg font-semibold text-neutral-900">{readCount}</p>
        </Card>
      </div>

      <Card className="space-y-3 border-neutral-200/80">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={filter === "all" ? "primary" : "secondary"}
              aria-pressed={filter === "all"}
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              type="button"
              size="sm"
              variant={filter === "unread" ? "primary" : "secondary"}
              aria-pressed={filter === "unread"}
              onClick={() => setFilter("unread")}
            >
              Unread
            </Button>
            <Button
              type="button"
              size="sm"
              variant={filter === "read" ? "primary" : "secondary"}
              aria-pressed={filter === "read"}
              onClick={() => setFilter("read")}
            >
              Read
            </Button>
            <Badge variant="brand">{unreadCount} unread</Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => mutateNotifications({ markAll: true })}
              disabled={isSubmitting}
            >
              Mark all read
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => mutateNotifications({ clearRead: true })}
              disabled={isSubmitting}
            >
              Clear read
            </Button>
          </div>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Search notifications</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title or message"
            className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900"
          />
        </label>
      </Card>

      {mutationError ? (
        <Card className="border-amber-200 bg-amber-50 text-amber-900">
          <p className="text-sm font-medium">Some actions could not be completed.</p>
          <p className="mt-1 text-sm">{mutationError}</p>
        </Card>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          title="No notifications match"
          description="Try changing your filter or search query."
        />
      ) : (
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
                  <Badge variant={isUnread ? "brand" : "neutral"}>
                    {isUnread ? "Unread" : "Read"}
                  </Badge>
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
                      onClick={() => mutateNotifications({ notificationId: item.id })}
                      disabled={isSubmitting}
                    >
                      Mark read
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => mutateNotifications({ notificationId: item.id, markUnread: true })}
                      disabled={isSubmitting}
                    >
                      Mark unread
                    </Button>
                  )}

                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => mutateNotifications({ notificationId: item.id, dismiss: true })}
                    disabled={isSubmitting}
                  >
                    Dismiss
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
