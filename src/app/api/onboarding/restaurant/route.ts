import { NextResponse } from "next/server";
import { resolveListingAuthContext } from "@/lib/listing-auth-context";
import {
  getRestaurantOnboardingDraft,
  saveRestaurantOnboardingDraft,
} from "@/lib/restaurant-onboarding-store";
import { restaurantOnboardingSchema } from "@/lib/validation";

function canUseOnboarding(role: string | undefined) {
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
  if (!context.isAuthenticated || !canUseOnboarding(context.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const resolved = resolveRestaurantId(context, request);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  try {
    const draft = await getRestaurantOnboardingDraft(resolved.restaurantId);
    return NextResponse.json({ draft }, { status: 200 });
  } catch (error) {
    console.error("Failed to load restaurant onboarding", error);
    return NextResponse.json({ error: "Failed to load draft" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const context = await resolveListingAuthContext(request);
  if (!context.isAuthenticated || !canUseOnboarding(context.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const resolved = resolveRestaurantId(context, request);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const parsed = restaurantOnboardingSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload" },
      { status: 400 },
    );
  }

  try {
    const draft = await saveRestaurantOnboardingDraft(resolved.restaurantId, parsed.data);
    return NextResponse.json({ draft }, { status: 200 });
  } catch (error) {
    console.error("Failed to save restaurant onboarding", error);
    return NextResponse.json({ error: "Failed to save draft" }, { status: 500 });
  }
}
