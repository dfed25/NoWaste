export type PickupEventType =
  | "code_verified"
  | "picked_up"
  | "missed_pickup"
  | "expired";

export type PickupAuditEvent = {
  id: string;
  orderId: string;
  actor: "restaurant" | "customer" | "system";
  type: PickupEventType;
  at: string;
  note?: string;
};

export type PickupOrder = {
  id: string;
  reservationCode: string;
  pickupWindowEnd: string;
  fulfillmentStatus: "reserved" | "picked_up" | "missed_pickup" | "expired";
};

export function verifyPickupCode(order: PickupOrder, code: string) {
  return order.reservationCode.toLowerCase() === code.trim().toLowerCase();
}

export function markPickedUp(order: PickupOrder): PickupOrder {
  return { ...order, fulfillmentStatus: "picked_up" };
}

export function markMissedPickup(order: PickupOrder): PickupOrder {
  return { ...order, fulfillmentStatus: "missed_pickup" };
}

export function expireStaleReservations(
  orders: PickupOrder[],
  now = new Date(),
): PickupOrder[] {
  return orders.map((order) => {
    if (order.fulfillmentStatus !== "reserved") return order;
    const stale = new Date(order.pickupWindowEnd).getTime() < now.getTime();
    return stale ? { ...order, fulfillmentStatus: "expired" } : order;
  });
}

export function createPickupAuditEvent(
  orderId: string,
  actor: PickupAuditEvent["actor"],
  type: PickupEventType,
  note?: string,
): PickupAuditEvent {
  return {
    id: `evt_${Math.random().toString(36).slice(2, 10)}`,
    orderId,
    actor,
    type,
    at: new Date().toISOString(),
    note,
  };
}

