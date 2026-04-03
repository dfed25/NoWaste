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
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOrdersForCustomer } from "@/lib/order-store";
import { getCustomerIdCookieName, parseSignedCustomerId } from "@/lib/customer-id-cookie";

export async function GET() {
  const cookieStore = await cookies();
  const rawCustomerCookie = cookieStore.get(getCustomerIdCookieName())?.value;
  const customerId = parseSignedCustomerId(rawCustomerCookie);

  if (!customerId) {
    return NextResponse.json({ orders: [] }, { status: 200 });
  }

  try {
    const orders = await getOrdersForCustomer(customerId);
    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch customer orders", { customerId, error });
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
