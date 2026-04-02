import { NextResponse } from "next/server";
import { mockOrders } from "@/lib/marketplace";
import { expireStaleReservations } from "@/lib/pickup";

export async function POST(request: Request) {
  const expectedSecret = process.env.EXPIRE_RESERVATIONS_SECRET;
  if (!expectedSecret) {
    return NextResponse.json({ ok: false, error: "Job secret is not configured" }, { status: 500 });
  }

  const providedSecret = request.headers.get("x-job-secret");
  if (!providedSecret) {
    return NextResponse.json({ ok: false, error: "Missing job secret" }, { status: 401 });
  }
  if (providedSecret !== expectedSecret) {
    return NextResponse.json({ ok: false, error: "Invalid job secret" }, { status: 403 });
  }

  const input = mockOrders.map((order) => ({
    id: order.id,
    reservationCode: order.reservationCode,
    pickupWindowEnd: order.pickupWindowEnd,
    fulfillmentStatus: order.fulfillmentStatus,
  }));

  const updated = expireStaleReservations(input);
  const previousById = new Map(input.map((order) => [order.id, order.fulfillmentStatus]));
  const expiredCount = updated.filter((order) => {
    const previous = previousById.get(order.id);
    return previous !== "expired" && order.fulfillmentStatus === "expired";
  }).length;

  // Persist status transitions back into the mock store.
  for (const nextOrder of updated) {
    const current = mockOrders.find((order) => order.id === nextOrder.id);
    if (!current) continue;
    if (current.fulfillmentStatus !== nextOrder.fulfillmentStatus) {
      current.fulfillmentStatus = nextOrder.fulfillmentStatus;
    }
  }

  return NextResponse.json({
    ok: true,
    totalChecked: updated.length,
    expiredCount,
  });
}

