import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { listOrdersForCustomer } from "@/lib/order-store";

const CUSTOMER_COOKIE = "nw-user-id";

export async function GET() {
  const cookieStore = await cookies();
  const customerId = cookieStore.get(CUSTOMER_COOKIE)?.value ?? "demo-customer";

  try {
    const orders = await listOrdersForCustomer(customerId);
    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch customer orders", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
