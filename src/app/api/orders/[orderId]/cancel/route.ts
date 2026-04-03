import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { cancelOrder } from "@/lib/order-store";

const CUSTOMER_COOKIE = "nw-user-id";

export async function POST(
  _request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  const cookieStore = await cookies();
  const customerId = cookieStore.get(CUSTOMER_COOKIE)?.value ?? "demo-customer";
  const { orderId } = await context.params;

  try {
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
}
