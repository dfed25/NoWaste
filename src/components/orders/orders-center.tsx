"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { CustomerOrder } from "@/lib/marketplace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";

type StatusFilter = "all" | CustomerOrder["fulfillmentStatus"];

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function normalizeStatusLabel(status: CustomerOrder["fulfillmentStatus"]) {
  return status.replaceAll("_", " ");
}

function canCancel(order: CustomerOrder) {
  if (order.fulfillmentStatus !== "reserved") return false;
  return new Date(order.pickupWindowStart).getTime() - Date.now() > 30 * 60 * 1000;
}

export function OrdersCenter() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isMutating, setIsMutating] = useState(false);

  async function refreshOrders() {
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch("/api/orders/me", { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as {
        orders?: CustomerOrder[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not load orders");
      }
      setOrders(Array.isArray(payload.orders) ? payload.orders : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load orders");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refreshOrders();
  }, []);

  const stats = useMemo(() => {
    let upcoming = 0;
    let refundEligible = 0;
    let valueRecovered = 0;

    for (const order of orders) {
      if (order.fulfillmentStatus === "reserved") upcoming += 1;
      if (order.fulfillmentStatus === "expired" || order.fulfillmentStatus === "missed_pickup") {
        refundEligible += 1;
      }
      if (order.fulfillmentStatus === "reserved" || order.fulfillmentStatus === "picked_up") {
        valueRecovered += order.totalCents;
      }
    }

    return { total: orders.length, upcoming, refundEligible, valueRecovered };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusFilter !== "all" && order.fulfillmentStatus !== statusFilter) return false;
      if (!normalizedQuery) return true;
      const haystack = `${order.id} ${order.listingTitle}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [orders, query, statusFilter]);

  async function cancelReservation(orderId: string) {
    setIsMutating(true);
    setError(null);
    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, { method: "POST" });
      const payload = (await response.json().catch(() => ({}))) as {
        order?: CustomerOrder;
        error?: string;
      };
      if (!response.ok || !payload.order) {
        throw new Error(payload.error ?? "Could not cancel reservation");
      }
      setOrders((current) => current.map((order) => (order.id === orderId ? payload.order! : order)));
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : "Could not cancel reservation");
    } finally {
      setIsMutating(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-3 border-brand-100 bg-gradient-to-br from-brand-50 to-white">
        <h2 className="text-title-md">Orders center</h2>
        <p className="text-sm text-neutral-600">
          Track pickup status, view reservation codes, and handle cancellations from one place.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="space-y-0.5 p-3">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Total orders</p>
            <p className="text-xl font-semibold text-neutral-900">{stats.total}</p>
          </Card>
          <Card className="space-y-0.5 p-3">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Upcoming pickups</p>
            <p className="text-xl font-semibold text-emerald-700">{stats.upcoming}</p>
          </Card>
          <Card className="space-y-0.5 p-3">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Refund eligible</p>
            <p className="text-xl font-semibold text-amber-700">{stats.refundEligible}</p>
          </Card>
          <Card className="space-y-0.5 p-3">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Value recovered</p>
            <p className="text-xl font-semibold text-neutral-900">
              ${(stats.valueRecovered / 100).toFixed(2)}
            </p>
          </Card>
        </div>
      </Card>

      <Card className="grid gap-3 md:grid-cols-2">
        <Input
          label="Search orders"
          placeholder="Search by order ID or listing title"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-neutral-800">Status filter</span>
          <select
            className="h-11 rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          >
            <option value="all">All statuses</option>
            <option value="reserved">Reserved</option>
            <option value="picked_up">Picked up</option>
            <option value="missed_pickup">Missed pickup</option>
            <option value="expired">Expired</option>
          </select>
        </label>
      </Card>

      {error ? <ErrorState message={error} /> : null}

      {isLoading ? (
        <Card role="status" aria-busy="true">
          <p className="text-sm text-neutral-600">Loading your orders...</p>
        </Card>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          title="No matching orders"
          description="Try adjusting your search or filter, or place a new reservation."
          action={
            <Link href="/">
              <Button size="sm">Browse listings</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const cancelOpen = canCancel(order);
            const refundEligible =
              order.fulfillmentStatus === "expired" || order.fulfillmentStatus === "missed_pickup";
            return (
              <Card key={order.id} className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900">{order.listingTitle}</h3>
                    <p className="text-xs text-neutral-500">Order {order.id}</p>
                  </div>
                  <Badge variant={refundEligible ? "warning" : "neutral"}>
                    {normalizeStatusLabel(order.fulfillmentStatus)}
                  </Badge>
                </div>
                <div className="grid gap-2 text-xs text-neutral-600 sm:grid-cols-2 lg:grid-cols-4">
                  <p>Qty {order.quantity}</p>
                  <p>Total ${(order.totalCents / 100).toFixed(2)}</p>
                  <p>Pickup start {formatTime(order.pickupWindowStart)}</p>
                  <p>Pickup end {formatTime(order.pickupWindowEnd)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/orders/confirmation?listingId=${order.listingId}&quantity=${order.quantity}&orderId=${order.id}`}
                    className="inline-flex h-9 items-center justify-center rounded-xl bg-brand-600 px-3 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                  >
                    View pickup code
                  </Link>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!cancelOpen || isMutating}
                    onClick={() => void cancelReservation(order.id)}
                  >
                    {cancelOpen ? "Cancel reservation" : "Cancellation closed"}
                  </Button>
                  <Badge variant={refundEligible ? "success" : "neutral"}>
                    Refund {refundEligible ? "eligible" : "not eligible"}
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
