"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CancelReservationButton } from "@/components/orders/cancel-reservation-button";
import { canCancelOrder, qualifiesForRefund, type CustomerOrder } from "@/lib/marketplace";

type Props = {
  orders: CustomerOrder[];
};

type OrderFilter = "all" | CustomerOrder["fulfillmentStatus"];

const FILTERS: { id: OrderFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "reserved", label: "Reserved" },
  { id: "picked_up", label: "Picked up" },
  { id: "canceled", label: "Canceled" },
  { id: "expired", label: "Expired" },
  { id: "missed_pickup", label: "Missed" },
];

function formatCurrency(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatTime(value: string) {
  const date = new Date(value);
  const today = new Date();

  const time = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  if (isSameLocalDay(date, today)) {
    return time;
  }

  const day = date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `${day}, ${time}`;
}

function normalizeStatusLabel(status: CustomerOrder["fulfillmentStatus"]) {
  return status.replaceAll("_", " ");
}

export function OrdersManager({ orders }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<OrderFilter>("all");

  const sorted = useMemo(() => {
    return [...orders].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [orders]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();

    return sorted.filter((order) => {
      if (filter !== "all" && order.fulfillmentStatus !== filter) return false;

      if (!query) return true;
      const haystack = `${order.id} ${order.listingTitle}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [filter, search, sorted]);

  const stats = useMemo(() => {
    let upcomingCount = 0;
    let totalSaved = 0;
    let refundEligibleCount = 0;

    for (const order of orders) {
      if (order.fulfillmentStatus === "reserved" || order.fulfillmentStatus === "picked_up") {
        totalSaved += order.totalCents;
      }
      if (order.fulfillmentStatus === "reserved") upcomingCount += 1;
      if (qualifiesForRefund(order)) refundEligibleCount += 1;
    }

    return {
      totalOrders: orders.length,
      upcomingCount,
      refundEligibleCount,
      totalSaved,
    };
  }, [orders]);

  if (orders.length === 0) {
    return (
      <Card className="space-y-2">
        <p className="text-sm font-medium text-neutral-800">No orders yet.</p>
        <p className="text-sm text-neutral-600">Place a reservation to see it here.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Total orders</p>
          <p className="text-xl font-semibold text-neutral-900">{stats.totalOrders}</p>
        </Card>
        <Card className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Upcoming pickups</p>
          <p className="text-xl font-semibold text-neutral-900">{stats.upcomingCount}</p>
        </Card>
        <Card className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Value recovered</p>
          <p className="text-xl font-semibold text-emerald-700">{formatCurrency(stats.totalSaved)}</p>
        </Card>
      </div>

      <Card className="space-y-3">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by listing title or order ID"
          aria-label="Search orders"
        />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter orders by status">
          {FILTERS.map((item) => (
            <Button
              key={item.id}
              size="sm"
              variant={filter === item.id ? "primary" : "secondary"}
              aria-pressed={filter === item.id}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </Card>

      {visible.length === 0 ? (
        <Card>
          <p className="text-sm text-neutral-700">No orders match your current filters.</p>
        </Card>
      ) : null}

      <div className="space-y-3">
        {visible.map((order) => {
          const canCancel = canCancelOrder(order);
          const refundEligible = qualifiesForRefund(order);

          return (
            <Card key={order.id} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-neutral-900">{order.listingTitle}</h2>
                <Badge variant={refundEligible ? "warning" : "neutral"}>
                  {normalizeStatusLabel(order.fulfillmentStatus)}
                </Badge>
              </div>
              <p className="text-xs text-neutral-600">
                Order ID: {order.id} · Qty {order.quantity} · Total {formatCurrency(order.totalCents)}
              </p>
              <p className="text-xs text-neutral-600">Payment status: {order.paymentStatus}</p>
              <p className="text-xs text-neutral-600">
                Pickup: {formatTime(order.pickupWindowStart)} - {formatTime(order.pickupWindowEnd)}
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/orders/confirmation?orderId=${encodeURIComponent(order.id)}`}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-brand-600 px-3 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                >
                  View pickup code
                </Link>
                <CancelReservationButton orderId={order.id} disabled={!canCancel} />
                <Badge variant={refundEligible ? "success" : "neutral"}>
                  Refund {refundEligible ? "eligible" : "not eligible"}
                </Badge>
              </div>
            </Card>
          );
        })}
      </div>

      {stats.refundEligibleCount > 0 ? (
        <Card>
          <p className="text-xs text-neutral-700">
            {stats.refundEligibleCount} order{stats.refundEligibleCount === 1 ? " is" : "s are"} currently
            refund eligible.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
