import "server-only";

import type { CustomerOrder } from "@/lib/marketplace";
import { resolveRestaurantIdForOrder } from "@/lib/marketplace";
import { getOrderByIdUnscoped, updateOrderFulfillment } from "@/lib/order-store";
import type { PickupAuditEvent } from "@/lib/pickup";
import { tryAppendPickupAuditEvent } from "@/lib/pickup-audit-store";

export type FulfillmentWithAuditResult =
  | { ok: true; event: PickupAuditEvent; order: CustomerOrder }
  | { ok: false; message: string; status: number };

/**
 * Authoritative path for staff pickup completion: validates reserved state, atomically
 * dedupes + appends audit under a file lock, then updates fulfillment.
 */
export async function finalizeReservedPickupWithAudit(options: {
  orderId: string;
  status: "picked_up" | "missed_pickup";
}): Promise<FulfillmentWithAuditResult> {
  const order = await getOrderByIdUnscoped(options.orderId);
  if (!order) {
    return { ok: false, message: "Order not found", status: 404 };
  }

  const restaurantId = resolveRestaurantIdForOrder(order);
  if (!restaurantId) {
    return { ok: false, message: "Order has no restaurant scope", status: 400 };
  }

  if (order.fulfillmentStatus !== "reserved") {
    return {
      ok: false,
      message: "Pickup completion requires a reserved order",
      status: 409,
    };
  }

  let event: PickupAuditEvent;
  try {
    const appended = await tryAppendPickupAuditEvent({
      restaurantId,
      orderId: options.orderId,
      actor: "restaurant",
      type: options.status,
    });
    if (!appended.ok) {
      return { ok: false, message: "This audit event was already recorded", status: 409 };
    }
    event = appended.event;
  } catch (error) {
    console.error("finalizeReservedPickupWithAudit: append audit failed", error);
    if (error instanceof Error && error.message === "pickup_audit_lock_timeout") {
      return { ok: false, message: "Server busy, please retry.", status: 503 };
    }
    return { ok: false, message: "Failed to record audit", status: 500 };
  }

  const updated = await updateOrderFulfillment(options.orderId, options.status);
  if (!updated) {
    console.warn(
      "finalizeReservedPickupWithAudit: fulfillment update failed after audit",
      options.orderId,
    );
    return {
      ok: false,
      message:
        "Order was not updated after audit; refresh and contact support if this persists.",
      status: 409,
    };
  }

  return { ok: true, event, order: updated };
}
