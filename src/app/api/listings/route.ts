import { NextResponse } from "next/server";
import { restaurants } from "@/lib/marketplace";
import { listManagedListings, saveListing } from "@/lib/marketplace-store";
import { resolveListingAuthContext, type ListingAuthContext } from "@/lib/listing-auth-context";
import { cookies } from "next/headers";
import { ADMIN_ROLE_COOKIE } from "@/lib/admin";
import { restaurants } from "@/lib/marketplace";
import { listAllListings, saveListing } from "@/lib/marketplace-store";
import { listingSchema } from "@/lib/validation";

function canManageListings(role: string | undefined) {
  return role === "restaurant_staff" || role === "admin";
}

function resolveTargetRestaurantId(
  context: ListingAuthContext,
  requestedRestaurantId?: string,
): { ok: true; restaurantId: string } | { ok: false; status: number; error: string } {
  if (context.role === "restaurant_staff" && !context.scopedRestaurantId) {
    return {
      ok: false,
      status: 403,
      error: "Restaurant staff must be scoped to a restaurant",
    };
  }
  if (
    context.role === "restaurant_staff" &&
    requestedRestaurantId &&
    context.scopedRestaurantId !== requestedRestaurantId
  ) {
    return {
      ok: false,
      status: 403,
      error: "You can only manage listings for your assigned restaurant",
    };
  }

  const restaurantId = requestedRestaurantId ?? context.scopedRestaurantId;
  if (!restaurantId) {
    return { ok: false, status: 400, error: "Restaurant context is required" };
  }
  return { ok: true, restaurantId };
}

export async function GET(request: Request) {
  const context = await resolveListingAuthContext(request);
  if (!context.isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canManageListings(context.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (context.role === "restaurant_staff" && !context.scopedRestaurantId) {
    return NextResponse.json({ error: "Missing restaurant scope" }, { status: 403 });
  }

  try {
    const listings = await listManagedListings(
      context.role === "admin" ? {} : { restaurantId: context.scopedRestaurantId },
    );
    return NextResponse.json({ listings }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch managed listings", error);
    return NextResponse.json({ error: "Failed to load listings" }, { status: 500 });
export async function GET() {
  try {
    const merged = await listAllListings();
    return NextResponse.json({ listings: merged }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load listings";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const context = await resolveListingAuthContext(request);
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get(AUTH_COOKIE_NAME)?.value === "1";
  const role = cookieStore.get(ADMIN_ROLE_COOKIE)?.value;
  const scopedRestaurantId = cookieStore.get(RESTAURANT_ID_COOKIE_NAME)?.value;

  if (!context.isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canManageListings(context.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON payload" }, { status: 400 });
  }

  const parsed = listingSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid listing payload" },
      { status: 400 },
    );
  }

  const requestedRestaurantId =
    payload && typeof payload === "object" && typeof (payload as Record<string, unknown>).restaurantId === "string"
      ? ((payload as Record<string, unknown>).restaurantId as string)
      : undefined;

  const targetResolution = resolveTargetRestaurantId(context, requestedRestaurantId);
  if (!targetResolution.ok) {
    return NextResponse.json({ error: targetResolution.error }, { status: targetResolution.status });
  const targetRestaurantId = requestedRestaurantId ?? scopedRestaurantId;
  if (role === "restaurant_staff" && !scopedRestaurantId) {
    return NextResponse.json(
      { error: "Restaurant staff must be scoped to a restaurant" },
      { status: 403 },
    );
  }
  if (!targetRestaurantId) {
    return NextResponse.json({ error: "Restaurant context is required" }, { status: 400 });
  }
  if (
    role === "restaurant_staff" &&
    requestedRestaurantId &&
    scopedRestaurantId !== requestedRestaurantId
  ) {
    return NextResponse.json(
      { error: "You can only create listings for your assigned restaurant" },
      { status: 403 },
    );
  }

  const restaurant = restaurants.find((candidate) => candidate.id === targetResolution.restaurantId);
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const values = parsed.data;
  try {
    const created = await saveListing({
      values,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      distanceMiles: restaurant.distanceMiles,
    });
    return NextResponse.json({ ok: true, listingId: created.id }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to persist listing";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
