import { NextResponse } from "next/server";
import { listOrdersForRestaurant } from "@/lib/order-store";
import { resolveListingAuthContext } from "@/lib/listing-auth-context";
import { OrderApiErrorCode } from "@/lib/order-api-codes";

function canViewRestaurantOrders(role: string | undefined) {
  return role === "restaurant_staff" || role === "admin";
}

export async function GET(request: Request) {
  const context = await resolveListingAuthContext(request);
  if (!context.isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canViewRestaurantOrders(context.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const queryRestaurantId = url.searchParams.get("restaurantId")?.trim();

  let targetRestaurantId: string;
  if (context.role === "admin") {
    if (!queryRestaurantId) {
      return NextResponse.json(
        {
          error: "Admin requests must include a restaurantId query parameter",
          code: OrderApiErrorCode.ADMIN_RESTAURANT_ID_REQUIRED,
        },
        { status: 400 },
      );
    }
    targetRestaurantId = queryRestaurantId;
  } else {
    if (!context.scopedRestaurantId) {
      return NextResponse.json({ error: "Missing restaurant scope" }, { status: 403 });
    }
    if (queryRestaurantId && queryRestaurantId !== context.scopedRestaurantId) {
      return NextResponse.json({ error: "Cannot read another restaurant's orders" }, { status: 403 });
    }
    targetRestaurantId = context.scopedRestaurantId;
  }

  try {
    const orders = await listOrdersForRestaurant(targetRestaurantId);
    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("Failed to list restaurant orders", error);
    return NextResponse.json({ error: "Failed to load reservations" }, { status: 500 });
  }
}
