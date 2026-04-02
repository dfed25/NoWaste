import type { PickupAuditEvent } from "@/lib/pickup";
import { mockOrders } from "@/lib/marketplace";

export async function getPickupAuditEvents(): Promise<ReadonlyArray<PickupAuditEvent>> {
  const persistedEvents = mockOrders.map((order) => ({
    id: `evt_${order.id}`,
    orderId: order.id,
    actor:
      order.fulfillmentStatus === "expired"
        ? ("system" as const)
        : ("restaurant" as const),
    type:
      order.fulfillmentStatus === "reserved"
        ? ("code_verified" as const)
        : order.fulfillmentStatus,
    at: order.createdAt,
  }));

  // Snapshot + sort keeps consumer rendering deterministic and read-only.
  const snapshot = [...persistedEvents].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );
  return Object.freeze(snapshot);
}

