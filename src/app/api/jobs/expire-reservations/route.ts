import { NextResponse } from "next/server";
import { expireStalePersistedReservations } from "@/lib/order-store";

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

  try {
    const { totalChecked, expiredCount } = await expireStalePersistedReservations();
    return NextResponse.json({
      ok: true,
      totalChecked,
      expiredCount,
    });
  } catch (error) {
    console.error("expire-reservations job failed", error);
    return NextResponse.json({ ok: false, error: "Job failed" }, { status: 500 });
  }
}
