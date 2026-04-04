import "server-only";

import type { CustomerOrder } from "@/lib/marketplace";
import { resolveRestaurantIdForOrder } from "@/lib/marketplace";
import { getOrderByIdUnscoped, updateOrderFulfillment } from "@/lib/order-store";
import type { PickupAuditEvent } from "@/lib/pickup";
import { appendPickupAuditEvent, hasPickupAuditEvent } from "@/lib/pickup-audit-store";

export type FulfillmentWithAuditResult =
  | { ok: true; event: PickupAuditEvent; order: CustomerOrder }
  | { ok: false; message: string; status: number };

/**
 * Authoritative path for staff pickup completion: validates reserved state, dedupes audit,
 * appends the audit row, then updates fulfillment. Call only after auth/scope checks.
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

  if (await hasPickupAuditEvent(restaurantId, options.orderId, options.status)) {
    return { ok: false, message: "This audit event was already recorded", status: 409 };
  }

  let event: PickupAuditEvent;
  try {
    event = await appendPickupAuditEvent({
      restaurantId,
      orderId: options.orderId,
      actor: "restaurant",
      type: options.status,
    });
  } catch (error) {
    console.error("finalizeReservedPickupWithAudit: append audit failed", error);
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
