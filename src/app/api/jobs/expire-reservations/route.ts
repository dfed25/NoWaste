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
  const expiredCount = updated.filter((order) => order.fulfillmentStatus === "expired").length;

  return NextResponse.json({
    ok: true,
    totalChecked: updated.length,
    expiredCount,
  });
}

