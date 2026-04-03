import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveRestaurantIdForOrder } from "@/lib/marketplace";
import { getOrderByIdUnscoped, updateOrderFulfillment } from "@/lib/order-store";
import { resolveListingAuthContext, type ListingAuthContext } from "@/lib/listing-auth-context";

const bodySchema = z
  .object({
    status: z.enum(["picked_up", "missed_pickup"]),
  })
  .strict();

function canManageFulfillment(role: string | undefined) {
  return role === "restaurant_staff" || role === "admin";
}

function canActOnOrder(context: ListingAuthContext, orderRestaurantId: string | undefined): boolean {
  if (context.role === "admin") return true;
  if (!orderRestaurantId) return false;
  if (context.role === "restaurant_staff" && context.scopedRestaurantId === orderRestaurantId) {
    return true;
  }
  return false;
}

export async function PATCH(request: Request, context: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await context.params;
  if (!orderId?.trim()) {
    return NextResponse.json({ error: "Missing order id" }, { status: 400 });
  }

  const auth = await resolveListingAuthContext(request);
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canManageFulfillment(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON payload" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload" },
      { status: 400 },
    );
  }

  const order = await getOrderByIdUnscoped(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const orderRestaurantId = resolveRestaurantIdForOrder(order);
  if (!canActOnOrder(auth, orderRestaurantId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const updated = await updateOrderFulfillment(orderId, parsed.data.status);
    if (!updated) {
      return NextResponse.json(
        { error: "Order cannot be updated (not reserved or already completed)" },
        { status: 409 },
      );
    }
    return NextResponse.json({ order: updated }, { status: 200 });
  } catch (error) {
    console.error("Failed to update order fulfillment", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
