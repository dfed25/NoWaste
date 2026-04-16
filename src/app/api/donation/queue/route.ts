import { NextResponse } from "next/server";
import { resolveListingAuthContext, staffRestaurantOperationsBlocked } from "@/lib/listing-auth-context";
import { getDonationQueue, setDonationQueue } from "@/lib/donation-queue-store";
import { donationQueuePayloadSchema } from "@/lib/validation";

function canManage(role: string | undefined) {
  return role === "restaurant_staff" || role === "admin";
}

function resolveRestaurantId(
  context: Awaited<ReturnType<typeof resolveListingAuthContext>>,
  request: Request,
): { ok: true; restaurantId: string } | { ok: false; status: number; error: string } {
  const url = new URL(request.url);
  if (context.role === "admin") {
    const id = url.searchParams.get("restaurantId")?.trim();
    if (!id) {
      return { ok: false, status: 400, error: "restaurantId query parameter is required for admin" };
    }
    return { ok: true, restaurantId: id };
  }
  if (context.role === "restaurant_staff") {
    if (!context.scopedRestaurantId) {
      return { ok: false, status: 403, error: "Missing restaurant scope" };
    }
    return { ok: true, restaurantId: context.scopedRestaurantId };
  }
  return { ok: false, status: 403, error: "Forbidden" };
}

export async function GET(request: Request) {
  const context = await resolveListingAuthContext(request);
  if (!context.isAuthenticated || !canManage(context.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const resolved = resolveRestaurantId(context, request);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }
  const staffBlock = staffRestaurantOperationsBlocked(context);
  if (staffBlock) {
    return NextResponse.json({ error: staffBlock.error }, { status: staffBlock.status });
  }

  try {
    const queue = await getDonationQueue(resolved.restaurantId);
    return NextResponse.json({ queue }, { status: 200 });
  } catch (error) {
    console.error("Failed to load donation queue", error);
    return NextResponse.json({ error: "Failed to load queue" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const context = await resolveListingAuthContext(request);
  if (!context.isAuthenticated || !canManage(context.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const resolved = resolveRestaurantId(context, request);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }
  const staffBlock = staffRestaurantOperationsBlocked(context);
  if (staffBlock) {
    return NextResponse.json({ error: staffBlock.error }, { status: staffBlock.status });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const parsed = donationQueuePayloadSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload" },
      { status: 400 },
    );
  }

  const mismatched = parsed.data.queue.some((item) => item.restaurantId !== resolved.restaurantId);
  if (mismatched) {
    return NextResponse.json({ error: "Queue items must match your restaurant scope" }, { status: 400 });
  }

  try {
    await setDonationQueue(resolved.restaurantId, parsed.data.queue);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Failed to save donation queue", error);
    return NextResponse.json({ error: "Failed to save queue" }, { status: 500 });
  }
}
