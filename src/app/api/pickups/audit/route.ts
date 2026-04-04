import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveRestaurantIdForOrder } from "@/lib/marketplace";
import { getOrderByIdUnscoped } from "@/lib/order-store";
import { resolveListingAuthContext, type ListingAuthContext } from "@/lib/listing-auth-context";
import { finalizeReservedPickupWithAudit } from "@/lib/pickup-fulfillment-with-audit";
import {
  appendPickupAuditEvent,
  hasPickupAuditEvent,
  listPickupAuditEventsForScope,
} from "@/lib/pickup-audit-store";

const postSchema = z
  .object({
    orderId: z.string().min(1),
    type: z.enum(["code_verified", "picked_up", "missed_pickup"]),
    note: z.string().max(500).optional(),
  })
  .strict();

/** Staff and admins may read scoped pickup audit history. */
function canManage(role: string | undefined) {
  return role === "restaurant_staff" || role === "admin";
}

function canActOnOrder(
  context: ListingAuthContext,
  orderRestaurantId: string | undefined,
): boolean {
  if (context.role === "admin") return true;
  if (!orderRestaurantId) return false;
  return context.role === "restaurant_staff" && context.scopedRestaurantId === orderRestaurantId;
}

/** GET /api/pickups/audit — list events for the caller’s restaurant (or all, for admin). */
export async function GET(request: Request) {
  const context = await resolveListingAuthContext(request);
  if (!context.isAuthenticated || !canManage(context.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = context.role === "admin";
  const restaurantId =
    context.role === "restaurant_staff" ? (context.scopedRestaurantId ?? null) : null;

  if (!isAdmin && !restaurantId) {
    return NextResponse.json({ error: "Missing restaurant scope" }, { status: 403 });
  }

  try {
    const events = await listPickupAuditEventsForScope({ restaurantId, isAdmin });
    return NextResponse.json({ events }, { status: 200 });
  } catch (error) {
    console.error("Failed to list pickup audit events", error);
    return NextResponse.json({ error: "Failed to load audit log" }, { status: 500 });
  }
}

/**
 * POST /api/pickups/audit — append verification or finalize pickup.
 * `picked_up` / `missed_pickup` run through {@link finalizeReservedPickupWithAudit} (audit + order row).
 */
export async function POST(request: Request) {
  const context = await resolveListingAuthContext(request);
  if (!context.isAuthenticated || !canManage(context.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const parsed = postSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload" },
      { status: 400 },
    );
  }

  const order = await getOrderByIdUnscoped(parsed.data.orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const orderRestaurantId = resolveRestaurantIdForOrder(order);
  if (!canActOnOrder(context, orderRestaurantId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!orderRestaurantId) {
    return NextResponse.json({ error: "Order has no restaurant scope" }, { status: 400 });
  }

  if (parsed.data.type === "picked_up" || parsed.data.type === "missed_pickup") {
    const result = await finalizeReservedPickupWithAudit({
      orderId: parsed.data.orderId,
      status: parsed.data.type,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: result.status });
    }
    return NextResponse.json(
      { event: result.event, order: result.order },
      { status: 201 },
    );
  }

  if (order.fulfillmentStatus !== "reserved") {
    return NextResponse.json(
      { error: "Audit events for pickup are only valid while the order is reserved" },
      { status: 409 },
    );
  }

  const duplicate = await hasPickupAuditEvent(
    orderRestaurantId,
    parsed.data.orderId,
    parsed.data.type,
  );
  if (duplicate) {
    return NextResponse.json({ error: "This audit event was already recorded" }, { status: 409 });
  }

  try {
    const event = await appendPickupAuditEvent({
      restaurantId: orderRestaurantId,
      orderId: parsed.data.orderId,
      actor: "restaurant",
      type: parsed.data.type,
      note: parsed.data.note,
    });
    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Failed to append pickup audit event", error);
    return NextResponse.json({ error: "Failed to record event" }, { status: 500 });
  }
}
