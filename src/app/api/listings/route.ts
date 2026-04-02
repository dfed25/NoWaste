import { NextResponse } from "next/server";
import { ADMIN_ROLE_COOKIE } from "@/lib/admin";
import { restaurants } from "@/lib/marketplace";
import { saveListing } from "@/lib/marketplace-store";
import { listingSchema } from "@/lib/validation";

const AUTH_COOKIE_NAME = "nw-authenticated";
const RESTAURANT_ID_COOKIE_NAME = "nw-restaurant-id";

function parseCookies(cookieHeader: string) {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((value) => value.trim())
      .filter(Boolean)
      .map((pair) => {
        const index = pair.indexOf("=");
        if (index < 0) return [pair, ""];
        return [pair.slice(0, index), decodeURIComponent(pair.slice(index + 1))];
      }),
  );
}

export async function POST(request: Request) {
  const cookies = parseCookies(request.headers.get("cookie") ?? "");
  const isAuthenticated = cookies[AUTH_COOKIE_NAME] === "1";
  const role = cookies[ADMIN_ROLE_COOKIE];
  const scopedRestaurantId = cookies[RESTAURANT_ID_COOKIE_NAME];

  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (role !== "restaurant_staff" && role !== "admin") {
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

  const targetRestaurantId = requestedRestaurantId ?? scopedRestaurantId;
  if (!targetRestaurantId) {
    return NextResponse.json({ error: "Restaurant context is required" }, { status: 400 });
  }
  if (
    role === "restaurant_staff" &&
    scopedRestaurantId &&
    requestedRestaurantId &&
    scopedRestaurantId !== requestedRestaurantId
  ) {
    return NextResponse.json(
      { error: "You can only create listings for your assigned restaurant" },
      { status: 403 },
    );
  }

  const restaurant = restaurants.find((candidate) => candidate.id === targetRestaurantId);
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

