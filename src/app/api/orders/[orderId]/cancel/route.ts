import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { cancelOrderIfAllowed, getOrderById } from "@/lib/order-store";
import { restoreListingQuantityById } from "@/lib/marketplace-store";

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

  await restoreListingQuantityById(canceled.listingId, canceled.quantity);

  return NextResponse.json({ ok: true, order: canceled }, { status: 200 });
}
