import "server-only";

import type { CustomerOrder } from "@/lib/marketplace";
import { resolveRestaurantIdForOrder } from "@/lib/marketplace";
import { getOrderByIdUnscoped, updateOrderFulfillment } from "@/lib/order-store";
import { effectivePickupFulfillmentFromOrder, type PickupAuditEvent } from "@/lib/pickup";
import { tryAppendPickupAuditEvent } from "@/lib/pickup-audit-store";

export type FulfillmentWithAuditResult =
  | { ok: true; event: PickupAuditEvent | null; order: CustomerOrder }
  | { ok: false; message: string; status: number };

function toPickupSlice(order: CustomerOrder) {
  return {
    id: order.id,
    reservationCode: order.reservationCode,
    pickupWindowEnd: order.pickupWindowEnd,
    fulfillmentStatus: order.fulfillmentStatus,
  };
}

/**
 * Authoritative path for staff pickup: applies window-aware reserved check, updates fulfillment
 * first, then appends the audit row (so the log never claims terminal state without the order row).
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

  const effective = effectivePickupFulfillmentFromOrder(toPickupSlice(order));
  if (effective !== "reserved") {
    return {
      ok: false,
      message:
        effective === "expired"
          ? "This reservation is past its pickup window."
          : "Pickup completion requires an active reserved order.",
      status: 409,
    };
  }

  const updated = await updateOrderFulfillment(options.orderId, options.status);
  if (!updated) {
    return {
      ok: false,
      message: "Pickup completion requires a reserved order",
      status: 409,
    };
  }

  try {
    const appended = await tryAppendPickupAuditEvent({
      restaurantId,
      orderId: options.orderId,
      actor: "restaurant",
      type: options.status,
    });
    if (!appended.ok) {
      console.warn(
        "finalizeReservedPickupWithAudit: audit duplicate after fulfillment",
        options.orderId,
      );
      return { ok: true, event: null, order: updated };
    }
    return { ok: true, event: appended.event, order: updated };
  } catch (error) {
    console.error("finalizeReservedPickupWithAudit: append audit failed after fulfillment", error);
    return { ok: true, event: null, order: updated };
  }
}
