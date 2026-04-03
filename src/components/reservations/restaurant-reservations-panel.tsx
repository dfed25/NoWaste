"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { CustomerOrder } from "@/lib/marketplace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";

type RestaurantChoice = { id: string; name: string };

type Props = {
  restaurantChoices: RestaurantChoice[];
};

type StatusFilter = "all" | CustomerOrder["fulfillmentStatus"];

function formatPickupRange(start: string, end: string) {
  const a = new Date(start);
  const b = new Date(end);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return "—";
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" };
  return `${a.toLocaleString([], opts)} – ${b.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

const DEFAULT_CURRENCY = "USD";

function formatMoney(cents: number, currency: string = DEFAULT_CURRENCY) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);
}

function statusBadgeVariant(status: CustomerOrder["fulfillmentStatus"]) {
  if (status === "reserved") return "brand" as const;
  if (status === "picked_up") return "success" as const;
  if (status === "missed_pickup") return "warning" as const;
  return "neutral" as const;
}

export function RestaurantReservationsPanel({ restaurantChoices }: Props) {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminRestaurantId, setAdminRestaurantId] = useState("");
  const [showAdminRestaurantPicker, setShowAdminRestaurantPicker] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const refreshAbortRef = useRef<AbortController | null>(null);
  const refreshSeqRef = useRef(0);

  const loadUrl = useMemo(() => {
    if (showAdminRestaurantPicker && adminRestaurantId) {
      return `/api/orders/restaurant?restaurantId=${encodeURIComponent(adminRestaurantId)}`;
    }
    return "/api/orders/restaurant";
  }, [adminRestaurantId, showAdminRestaurantPicker]);

  const refresh = useCallback(async () => {
    refreshAbortRef.current?.abort();
    const controller = new AbortController();
    refreshAbortRef.current = controller;
    const seq = ++refreshSeqRef.current;

    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch(loadUrl, { cache: "no-store", signal: controller.signal });
      const payload = (await response.json().catch(() => ({}))) as {
        orders?: CustomerOrder[];
        error?: string;
      };

      if (seq !== refreshSeqRef.current) return;

      if (response.status === 400 && /restaurantId/i.test(payload.error ?? "")) {
        if (seq !== refreshSeqRef.current) return;
        if (!restaurantChoices.length) {
          throw new Error("No restaurants are configured to scope admin reservations.");
        }
        const first = restaurantChoices[0]?.id ?? "";
        setShowAdminRestaurantPicker(true);
        if (first && !adminRestaurantId) {
          setAdminRestaurantId(first);
        }
        setOrders([]);
        return;
      }

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not load reservations");
      }
      if (seq !== refreshSeqRef.current) return;
      setOrders(Array.isArray(payload.orders) ? payload.orders : []);
    } catch (loadError) {
      if (loadError instanceof DOMException && loadError.name === "AbortError") return;
      if (seq !== refreshSeqRef.current) return;
      setError(loadError instanceof Error ? loadError.message : "Could not load reservations");
    } finally {
      if (seq === refreshSeqRef.current) {
        setIsLoading(false);
      }
    }
  }, [adminRestaurantId, loadUrl, restaurantChoices]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function setFulfillment(orderId: string, status: "picked_up" | "missed_pickup") {
    const label = status === "picked_up" ? "mark this order as picked up" : "record a no-show for this order";
    if (!window.confirm(`Confirm: ${label}?`)) return;

    setMutatingId(orderId);
    setError(null);
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}/fulfillment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        order?: CustomerOrder;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Update failed");
      }
      if (payload.order) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? payload.order! : o)));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setMutatingId(null);
    }
  }

  const stats = useMemo(() => {
    let reserved = 0;
    let picked = 0;
    let revenueCents = 0;
    for (const o of orders) {
      if (o.fulfillmentStatus === "reserved") reserved += 1;
      if (o.fulfillmentStatus === "picked_up") picked += 1;
      if (o.fulfillmentStatus === "reserved" || o.fulfillmentStatus === "picked_up") {
        if (o.paymentStatus === "paid") revenueCents += o.totalCents;
      }
    }
    const displayCurrency =
      orders.find((o) => o.currency?.trim())?.currency?.trim() ?? DEFAULT_CURRENCY;
    return { reserved, picked, revenueCents, total: orders.length, displayCurrency };
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.fulfillmentStatus !== statusFilter) return false;
      if (!q) return true;
      const haystack = `${o.id} ${o.listingTitle} ${o.reservationCode}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [orders, query, statusFilter]);

  if (isLoading && orders.length === 0 && !error) {
    return (
      <Card className="space-y-2" role="status" aria-busy="true" aria-live="polite">
        <p className="text-sm text-neutral-600">Loading reservations…</p>
        <span className="sr-only">Loading reservations</span>
      </Card>
    );
  }

  if (error && orders.length === 0 && !showAdminRestaurantPicker) {
    return (
      <ErrorState
        title="Could not load reservations"
        message={error}
        action={
          <Button type="button" variant="secondary" size="sm" onClick={() => void refresh()}>
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      {showAdminRestaurantPicker && restaurantChoices.length > 0 ? (
        <Card className="flex flex-col gap-3 border-dashed border-brand-200 bg-brand-50/40 p-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-neutral-900">Restaurant scope</p>
            <p className="text-xs text-neutral-600">
              Admins pick a kitchen to view live reservations from persisted checkouts.
            </p>
          </div>
          <label className="flex w-full flex-col gap-1 text-xs font-medium text-neutral-700 sm:w-64">
            Location
            <select
              className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              value={adminRestaurantId}
              onChange={(e) => {
                refreshAbortRef.current?.abort();
                setOrders([]);
                setIsLoading(true);
                setError(null);
                setAdminRestaurantId(e.target.value);
              }}
            >
              {restaurantChoices.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
        </Card>
      ) : null}

      {error ? (
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-neutral-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Awaiting pickup</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">{stats.reserved}</p>
        </Card>
        <Card className="border-neutral-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Picked up</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-800">{stats.picked}</p>
        </Card>
        <Card className="border-neutral-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Paid volume (shown)</p>
          <p className="mt-1 text-2xl font-semibold text-brand-800">
            {formatMoney(stats.revenueCents, stats.displayCurrency)}
          </p>
        </Card>
      </div>

      <Card className="space-y-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            className="sm:max-w-xs"
            placeholder="Search code, title, or order id…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search reservations"
          />
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <span className="whitespace-nowrap">Status</span>
            <select
              className="h-9 rounded-lg border border-neutral-200 bg-white px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <option value="all">All</option>
              <option value="reserved">Reserved</option>
              <option value="picked_up">Picked up</option>
              <option value="missed_pickup">No-show</option>
              <option value="expired">Expired</option>
            </select>
          </label>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No reservations match"
            description={
              stats.total === 0
                ? "When customers check out, their reservations appear here for pickup verification."
                : "Try another filter or search."
            }
          />
        ) : (
          <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-100">
            {filtered.map((order) => {
              const busy = mutatingId === order.id;
              return (
                <li key={order.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-neutral-900">{order.listingTitle}</p>
                      <Badge variant={statusBadgeVariant(order.fulfillmentStatus)}>
                        {order.fulfillmentStatus.replaceAll("_", " ")}
                      </Badge>
                      {order.paymentStatus === "pending" ? (
                        <Badge variant="warning">Payment pending</Badge>
                      ) : null}
                    </div>
                    <p className="text-xs text-neutral-500">
                      {formatPickupRange(order.pickupWindowStart, order.pickupWindowEnd)} · Qty {order.quantity} ·{" "}
                      {formatMoney(order.totalCents, order.currency ?? DEFAULT_CURRENCY)}
                    </p>
                    <p className="font-mono text-sm text-brand-800">{order.reservationCode}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={order.fulfillmentStatus !== "reserved" || busy}
                      onClick={() => void setFulfillment(order.id, "picked_up")}
                    >
                      Picked up
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={order.fulfillmentStatus !== "reserved" || busy}
                      onClick={() => void setFulfillment(order.id, "missed_pickup")}
                    >
                      No-show
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <p className="text-center text-xs text-neutral-500">
        Need the legacy code console?{" "}
        <Link href="/pickups/verify" className="font-medium text-brand-700 hover:underline">
          Open pickup verification
        </Link>
      </p>
    </div>
  );
}
