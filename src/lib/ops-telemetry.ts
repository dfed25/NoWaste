import "server-only";

/**
 * Structured operational events for log drains / future Sentry or metrics wiring.
 * Emit JSON lines on stderr so production aggregators can alert on `ops_event`.
 */

export function reportPickupAuditPostFulfillmentIssue(
  reason: "duplicate" | "exception",
  ctx: {
    restaurantId: string;
    orderId: string;
    status: "picked_up" | "missed_pickup";
    error?: unknown;
  },
): void {
  const base = {
    ops_event: "pickup_audit.post_fulfillment_mismatch",
    reason,
    severity: reason === "duplicate" ? ("warning" as const) : ("error" as const),
    restaurantId: ctx.restaurantId,
    orderId: ctx.orderId,
    status: ctx.status,
    at: new Date().toISOString(),
  };
  if (reason === "exception" && ctx.error !== undefined) {
    const message =
      ctx.error instanceof Error ? ctx.error.message : String(ctx.error);
    console.error(JSON.stringify({ ...base, errorMessage: message }));
    return;
  }
  console.error(JSON.stringify(base));
}
