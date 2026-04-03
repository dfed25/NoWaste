import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { cancelOrder, getOrderById } from "@/lib/order-store";
import { CUSTOMER_ID_COOKIE_NAME } from "@/lib/auth-cookies";

const CANCEL_CUTOFF_MS = 30 * 60 * 1000;

export async function POST(
  _request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  const cookieStore = await cookies();
  const customerId = cookieStore.get(CUSTOMER_ID_COOKIE_NAME)?.value ?? "demo-customer";
  const { orderId } = await context.params;

  try {
    const order = await getOrderById(orderId, customerId);
    if (!order) {
      return NextResponse.json(
        { error: "Order not found or cannot be canceled" },
        { status: 400 },
      );
    }
    const pickupStartMs = new Date(order.pickupWindowStart).getTime();
    if (!Number.isFinite(pickupStartMs) || pickupStartMs - Date.now() <= CANCEL_CUTOFF_MS) {
      return NextResponse.json(
        { error: "Order cannot be canceled within 30 minutes of pickup" },
        { status: 400 },
      );
    }

    const canceled = await cancelOrder(orderId, customerId);
    if (!canceled) {
      return NextResponse.json(
        { error: "Order not found or cannot be canceled" },
        { status: 400 },
      );
    }
    return NextResponse.json({ order: canceled }, { status: 200 });
  } catch (error) {
    console.error("Failed to cancel order", error);
    return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 });
  }
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { cancelOrderIfAllowed, getOrderById } from "@/lib/order-store";
import { restoreListingQuantityById } from "@/lib/marketplace-store";
import { createInAppNotification } from "@/lib/notification-center-store";

const AUTH_COOKIE_NAME = "nw-authenticated";

type Params = {
  params: Promise<{ orderId: string }>;
};

export async function POST(_request: Request, context: Params) {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get(AUTH_COOKIE_NAME)?.value === "1";
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await context.params;
  const before = await getOrderById(orderId);
  if (!before) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const canceled = await cancelOrderIfAllowed(orderId);
  if (!canceled) {
    return NextResponse.json(
      { error: "Order can no longer be canceled" },
      { status: 409 },
    );
  }

  const restored = await restoreListingQuantityById(canceled.listingId, canceled.quantity);
  if (!restored) {
    console.error("Failed to restore inventory after cancellation", {
      orderId: canceled.id,
      listingId: canceled.listingId,
      quantity: canceled.quantity,
    });
    return NextResponse.json(
      { error: "Order canceled but inventory restore failed" },
      { status: 500 },
    );
  }

  if (canceled.customerId) {
    await createInAppNotification({
      userId: canceled.customerId,
      title: "Reservation canceled",
      message: `Your order for ${canceled.quantity}x ${canceled.listingTitle} was canceled.`,
      linkHref: "/orders",
    });
  }

  return NextResponse.json({ ok: true, order: canceled }, { status: 200 });
}
