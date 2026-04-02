"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { mockOrders } from "@/lib/marketplace";
import {
  createPickupAuditEvent,
  expireStaleReservations,
  markMissedPickup,
  markPickedUp,
  verifyPickupCode,
  type PickupAuditEvent,
} from "@/lib/pickup";

export function PickupVerificationConsole() {
  const [orders, setOrders] = useState(
    expireStaleReservations(
      mockOrders.map((order) => ({
        id: order.id,
        reservationCode: order.reservationCode,
        pickupWindowEnd: order.pickupWindowEnd,
        fulfillmentStatus: order.fulfillmentStatus,
      })),
    ),
  );
  const [auditEvents, setAuditEvents] = useState<PickupAuditEvent[]>([]);
  const [code, setCode] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  );

  function handleVerify() {
    if (!selectedOrder || !code) return;
    if (!verifyPickupCode(selectedOrder, code)) return;
    setAuditEvents((prev) => [
      createPickupAuditEvent(selectedOrder.id, "restaurant", "code_verified"),
      ...prev,
    ]);
  }

  function setOutcome(outcome: "picked_up" | "missed_pickup") {
    if (!selectedOrder) return;
    const nextOrder =
      outcome === "picked_up" ? markPickedUp(selectedOrder) : markMissedPickup(selectedOrder);
    setOrders((prev) => prev.map((order) => (order.id === nextOrder.id ? nextOrder : order)));
    setAuditEvents((prev) => [
      createPickupAuditEvent(selectedOrder.id, "restaurant", outcome),
      ...prev,
    ]);
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <h2 className="text-title-md">Scan QR or enter code</h2>
        <p className="text-body-sm text-neutral-600">
          Camera scanning can be integrated here; manual fallback is active.
        </p>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <select
            className="h-11 rounded-xl border border-neutral-300 px-3 text-sm"
            value={selectedOrderId ?? ""}
            onChange={(event) => setSelectedOrderId(event.target.value || null)}
          >
            <option value="">Select reservation</option>
            {orders.map((order) => (
              <option key={order.id} value={order.id}>
                {order.id} ({order.fulfillmentStatus.replace("_", " ")})
              </option>
            ))}
          </select>
          <Input
            placeholder="NW-XXXX-XXXX"
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
          <Button onClick={handleVerify} disabled={!selectedOrder || !code}>
            Verify code
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => setOutcome("picked_up")}
            disabled={!selectedOrder}
          >
            Mark as picked up
          </Button>
          <Button
            variant="danger"
            onClick={() => setOutcome("missed_pickup")}
            disabled={!selectedOrder}
          >
            Mark as missed pickup
          </Button>
        </div>
      </Card>

      <Card className="space-y-2">
        <h3 className="text-sm font-semibold text-neutral-900">Pickup audit log</h3>
        {auditEvents.length === 0 ? (
          <p className="text-xs text-neutral-500">No pickup events yet.</p>
        ) : (
          <ul className="space-y-1">
            {auditEvents.map((event) => (
              <li key={event.id} className="flex items-center justify-between text-xs">
                <span className="text-neutral-700">
                  {event.orderId} - {event.type.replace("_", " ")}
                </span>
                <Badge variant="neutral">{new Date(event.at).toLocaleTimeString()}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

