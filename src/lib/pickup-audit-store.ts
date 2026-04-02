import type { PickupAuditEvent } from "@/lib/pickup";
import { mockOrders } from "@/lib/marketplace";

export async function getPickupAuditEvents(): Promise<ReadonlyArray<PickupAuditEvent>> {
  const persistedEvents: PickupAuditEvent[] = [];
  for (const order of mockOrders) {
    if (order.fulfillmentStatus === "reserved") continue;

    const transitionAt =
      // Support future status change timestamps while keeping mock fallback deterministic.
      ((order as unknown as { statusUpdatedAt?: string }).statusUpdatedAt ??
        new Date().toISOString());

    persistedEvents.push({
      id: `evt_${order.id}`,
      orderId: order.id,
      actor:
        order.fulfillmentStatus === "expired"
          ? ("system" as const)
          : ("restaurant" as const),
      type: order.fulfillmentStatus,
      at: transitionAt,
    });
  }

  // Snapshot + sort keeps consumer rendering deterministic and read-only.
  const snapshot = [...persistedEvents].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );
  return Object.freeze(snapshot);
}

