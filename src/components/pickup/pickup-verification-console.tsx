"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CustomerOrder } from "@/lib/marketplace";
import {
  expireStaleReservations,
  markMissedPickup,
  markPickedUp,
  verifyPickupCode,
  type PickupAuditEvent,
  type PickupOrder,
} from "@/lib/pickup";

function toPickupSlice(order: CustomerOrder): PickupOrder {
  return {
    id: order.id,
    reservationCode: order.reservationCode,
    pickupWindowEnd: order.pickupWindowEnd,
    fulfillmentStatus: order.fulfillmentStatus,
  };
}

export function PickupVerificationConsole() {
  const [rawOrders, setRawOrders] = useState<CustomerOrder[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [auditEvents, setAuditEvents] = useState<PickupAuditEvent[]>([]);
  const [code, setCode] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch("/api/orders/restaurant", { credentials: "include" });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        orders?: CustomerOrder[];
      };
      if (!response.ok) {
        setLoadError(payload.error || "Could not load reservations.");
        setRawOrders([]);
        return;
      }
      setRawOrders(Array.isArray(payload.orders) ? payload.orders : []);
    } catch {
      setLoadError("Network error loading reservations.");
      setRawOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    void fetch("/api/pickups/audit", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { events?: PickupAuditEvent[] } | null) => {
        if (payload?.events?.length) {
          setAuditEvents(payload.events);
        }
      })
      .catch(() => undefined);
  }, []);

  const orders = useMemo(() => {
    const slice = rawOrders.map(toPickupSlice);
    return expireStaleReservations(slice);
  }, [rawOrders]);

  const selectedFull = useMemo(() => {
    const full = rawOrders.find((order) => order.id === selectedOrderId);
    const derived = orders.find((order) => order.id === selectedOrderId);
    if (!full || !derived) return null;
    return { ...full, fulfillmentStatus: derived.fulfillmentStatus };
  }, [orders, rawOrders, selectedOrderId]);

  async function postAudit(
    orderId: string,
    type: "code_verified" | "picked_up" | "missed_pickup",
    pickupCode?: string,
  ): Promise<boolean> {
    const body =
      type === "code_verified"
        ? { orderId, type, pickupCode: pickupCode ?? "" }
        : { orderId, type };
    const response = await fetch("/api/pickups/audit", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) return false;
    const payload = (await response.json().catch(() => ({}))) as { event?: PickupAuditEvent };
    if (payload.event) {
      setAuditEvents((prev) => [payload.event!, ...prev]);
    }
    return true;
  }

  async function handleVerify() {
    setVerificationMessage(null);
    if (!selectedFull || !code) return;
    const slice = toPickupSlice(selectedFull);
    if (!verifyPickupCode(slice, code)) {
      setVerificationMessage("Invalid pickup code. Please retry.");
      return;
    }
    const ok = await postAudit(selectedFull.id, "code_verified", code);
    if (!ok) {
      setVerificationMessage("Could not record verification (duplicate or invalid state).");
      return;
    }
    setVerificationMessage("Code verified successfully.");
  }

  async function setOutcome(outcome: "picked_up" | "missed_pickup") {
    if (!selectedFull) return;
    const slice = toPickupSlice(selectedFull);
    setVerificationMessage(null);
    setActionPending(true);
    try {
      const optimistic =
        outcome === "picked_up" ? markPickedUp(slice) : markMissedPickup(slice);
      const auditResponse = await fetch("/api/pickups/audit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: selectedFull.id, type: outcome }),
      });
      const auditPayload = (await auditResponse.json().catch(() => ({}))) as {
        error?: string;
        event?: PickupAuditEvent;
        order?: CustomerOrder;
      };
      if (!auditResponse.ok) {
        setVerificationMessage(auditPayload.error || "Unable to finalize pickup.");
        return;
      }
      if (auditPayload.event) {
        setAuditEvents((prev) => [auditPayload.event!, ...prev]);
      }
      const nextOrder = auditPayload.order;
      setRawOrders((prev) =>
        prev.map((o) =>
          o.id === selectedFull.id
            ? nextOrder
              ? nextOrder
              : { ...o, fulfillmentStatus: optimistic.fulfillmentStatus }
            : o,
        ),
      );
      setVerificationMessage(`Order marked as ${outcome.replaceAll("_", " ")}.`);
    } catch {
      setVerificationMessage("Network error updating order.");
    } finally {
      setActionPending(false);
    }
  }

  return (
    <div className="space-y-4">
      {loadError ? (
        <p className="text-sm text-red-600">{loadError}</p>
      ) : null}
      {loading ? <p className="text-sm text-neutral-500">Loading reservations…</p> : null}

      <Card className="space-y-3">
        <h2 className="text-title-md">Scan QR or enter code</h2>
        <p className="text-body-sm text-neutral-600">
          Camera scanning can be integrated here; manual fallback is active. Status reflects pickup
          windows (expired shown when the window has passed).
        </p>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <select
            className="h-11 rounded-xl border border-neutral-300 px-3 text-sm"
            value={selectedOrderId ?? ""}
            onChange={(event) => setSelectedOrderId(event.target.value || null)}
          >
            <option value="">Select reservation</option>
            {orders.map((order) => {
              const full = rawOrders.find((o) => o.id === order.id);
              const title = full?.listingTitle ?? order.id;
              return (
                <option key={order.id} value={order.id}>
                  {title} — {order.fulfillmentStatus.replaceAll("_", " ")}
                </option>
              );
            })}
          </select>
          <Input
            placeholder="NW-XXXX-XXXX"
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
          <Button
            onClick={() => void handleVerify()}
            disabled={
              !selectedFull ||
              !code ||
              selectedFull.fulfillmentStatus !== "reserved" ||
              actionPending
            }
          >
            Verify code
          </Button>
        </div>
        {selectedFull ? (
          <p className="text-xs text-neutral-500">
            Code: <span className="font-mono">{selectedFull.reservationCode}</span>
          </p>
        ) : null}
        {verificationMessage ? (
          <p
            className={
              verificationMessage.startsWith("Code verified") ||
              verificationMessage.startsWith("Order marked")
                ? "text-xs text-green-700"
                : "text-xs text-red-600"
            }
          >
            {verificationMessage}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => void setOutcome("picked_up")}
            disabled={
              !selectedFull || selectedFull.fulfillmentStatus !== "reserved" || actionPending
            }
          >
            Mark as picked up
          </Button>
          <Button
            variant="danger"
            onClick={() => void setOutcome("missed_pickup")}
            disabled={
              !selectedFull || selectedFull.fulfillmentStatus !== "reserved" || actionPending
            }
          >
            Mark as missed pickup
          </Button>
          <Button variant="secondary" type="button" onClick={() => void loadOrders()} disabled={loading}>
            Refresh list
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
                  {event.orderId} - {event.type.replaceAll("_", " ")}
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
