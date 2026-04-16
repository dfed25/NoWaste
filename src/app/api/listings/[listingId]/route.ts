import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteManagedListing, updateManagedListing } from "@/lib/marketplace-store";
import { resolveListingAuthContext, staffRestaurantOperationsBlocked } from "@/lib/listing-auth-context";

function toIsoOrUndefined(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

const patchSchema = z
  .object({
    action: z.enum(["pause", "activate", "archive"]).optional(),
    title: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    allergyNotes: z.string().max(500).optional(),
    discountedPriceCents: z.number().int().nonnegative().optional(),
    quantityTotal: z.number().int().positive().optional(),
    quantityRemaining: z.number().int().nonnegative().optional(),
    pickupWindowStart: z.string().refine((value) => toIsoOrUndefined(value) !== undefined, {
      message: "pickupWindowStart must be a valid datetime",
    }).optional(),
    pickupWindowEnd: z.string().refine((value) => toIsoOrUndefined(value) !== undefined, {
      message: "pickupWindowEnd must be a valid datetime",
    }).optional(),
    reservationCutoffAt: z.string().refine((value) => toIsoOrUndefined(value) !== undefined, {
      message: "reservationCutoffAt must be a valid datetime",
    }).optional(),
  })
  .refine((value) => value.action || Object.keys(value).length > 0, {
    message: "Provide at least one update field",
  });

function mapActionToStatus(action: "pause" | "activate" | "archive") {
  if (action === "pause") return "paused" as const;
  if (action === "archive") return "archived" as const;
  return "active" as const;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ listingId: string }> },
) {
  const auth = await resolveListingAuthContext(request);
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (auth.role !== "restaurant_staff" && auth.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (auth.role === "restaurant_staff" && !auth.scopedRestaurantId) {
    return NextResponse.json({ error: "Missing restaurant scope" }, { status: 403 });
  }
  const staffBlock = staffRestaurantOperationsBlocked(auth);
  if (staffBlock) {
    return NextResponse.json({ error: staffBlock.error }, { status: staffBlock.status });
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
    pickupWindowStart: toIsoOrUndefined(payload.pickupWindowStart),
    pickupWindowEnd: toIsoOrUndefined(payload.pickupWindowEnd),
    reservationCutoffAt: toIsoOrUndefined(payload.reservationCutoffAt),
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
  request: Request,
  context: { params: Promise<{ listingId: string }> },
) {
  const auth = await resolveListingAuthContext(request);
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (auth.role !== "restaurant_staff" && auth.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (auth.role === "restaurant_staff" && !auth.scopedRestaurantId) {
    return NextResponse.json({ error: "Missing restaurant scope" }, { status: 403 });
  }
  const staffBlock = staffRestaurantOperationsBlocked(auth);
  if (staffBlock) {
    return NextResponse.json({ error: staffBlock.error }, { status: staffBlock.status });
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
