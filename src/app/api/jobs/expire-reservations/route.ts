import { NextResponse } from "next/server";
import { mockOrders } from "@/lib/marketplace";
import { expireStaleReservations } from "@/lib/pickup";

export async function POST() {
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

