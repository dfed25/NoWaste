import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ADMIN_ROLE_COOKIE } from "@/lib/admin";
import { deleteManagedListing, updateManagedListing } from "@/lib/marketplace-store";

const AUTH_COOKIE_NAME = "nw-authenticated";
const RESTAURANT_ID_COOKIE_NAME = "nw-restaurant-id";

const patchSchema = z
  .object({
    action: z.enum(["pause", "activate", "archive"]).optional(),
    title: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    allergyNotes: z.string().max(500).optional(),
    discountedPriceCents: z.number().int().nonnegative().optional(),
    quantityTotal: z.number().int().positive().optional(),
    quantityRemaining: z.number().int().nonnegative().optional(),
    pickupWindowStart: z.string().optional(),
    pickupWindowEnd: z.string().optional(),
    reservationCutoffAt: z.string().optional(),
  })
  .refine((value) => value.action || Object.keys(value).length > 0, {
    message: "Provide at least one update field",
  });

async function resolveAuthContext() {
  const cookieStore = await cookies();
  return {
    isAuthenticated: cookieStore.get(AUTH_COOKIE_NAME)?.value === "1",
    role: cookieStore.get(ADMIN_ROLE_COOKIE)?.value,
    scopedRestaurantId: cookieStore.get(RESTAURANT_ID_COOKIE_NAME)?.value,
  };
}

function mapActionToStatus(action: "pause" | "activate" | "archive") {
  if (action === "pause") return "paused" as const;
  if (action === "archive") return "archived" as const;
  return "active" as const;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ listingId: string }> },
) {
  const auth = await resolveAuthContext();
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (auth.role !== "restaurant_staff" && auth.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (auth.role === "restaurant_staff" && !auth.scopedRestaurantId) {
    return NextResponse.json({ error: "Missing restaurant scope" }, { status: 403 });
  }

  const payloadResult = await request
    .json()
    .then((value) => patchSchema.safeParse(value))
    .catch(() => patchSchema.safeParse({}));
  if (!payloadResult.success) {
    return NextResponse.json(
      { error: payloadResult.error.issues[0]?.message ?? "Invalid payload" },
      { status: 400 },
    );
  }

  const payload = payloadResult.data;
  const { listingId } = await context.params;
  const update = {
    status: payload.action ? mapActionToStatus(payload.action) : undefined,
    title: payload.title,
    description: payload.description,
    allergyNotes: payload.allergyNotes,
    priceCents: payload.discountedPriceCents,
    quantityTotal: payload.quantityTotal,
    quantityRemaining: payload.quantityRemaining,
    pickupWindowStart: payload.pickupWindowStart
      ? new Date(payload.pickupWindowStart).toISOString()
      : undefined,
    pickupWindowEnd: payload.pickupWindowEnd ? new Date(payload.pickupWindowEnd).toISOString() : undefined,
    reservationCutoffAt: payload.reservationCutoffAt
      ? new Date(payload.reservationCutoffAt).toISOString()
      : undefined,
  };

  try {
    const updated = await updateManagedListing(
      listingId,
      update,
      auth.role === "admin" ? {} : { restaurantId: auth.scopedRestaurantId },
    );
    if (!updated) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    return NextResponse.json({ listing: updated }, { status: 200 });
  } catch (error) {
    console.error("Failed to update listing", error);
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ listingId: string }> },
) {
  const auth = await resolveAuthContext();
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (auth.role !== "restaurant_staff" && auth.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (auth.role === "restaurant_staff" && !auth.scopedRestaurantId) {
    return NextResponse.json({ error: "Missing restaurant scope" }, { status: 403 });
  }

  const { listingId } = await context.params;
  try {
    const removed = await deleteManagedListing(
      listingId,
      auth.role === "admin" ? {} : { restaurantId: auth.scopedRestaurantId },
    );
    if (!removed) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete listing", error);
    return NextResponse.json({ error: "Failed to delete listing" }, { status: 500 });
  }
}
