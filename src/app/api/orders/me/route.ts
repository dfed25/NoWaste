import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOrdersForCustomer } from "@/lib/order-store";

export async function GET() {
  const cookieStore = await cookies();
  const customerId = cookieStore.get("nw-user-id")?.value;

  if (!customerId) {
    return NextResponse.json({ orders: [] }, { status: 200 });
  }

  const orders = await getOrdersForCustomer(customerId);
  return NextResponse.json({ orders }, { status: 200 });
}
