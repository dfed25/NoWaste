import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { upsertRestaurantRegistryEntry } from "@/lib/restaurant-registry";
import { restaurantStaffSignUpSchema } from "@/lib/validation";

function clientIp(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  return request.headers.get("x-real-ip")?.trim() || undefined;
}

/**
 * Creates a restaurant_staff user with metadata enforced on the server.
 * Requires SUPABASE_SERVICE_ROLE_KEY (not exposed to the browser).
 */
export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: "Restaurant sign-up is not configured (missing Supabase service role)." },
      { status: 503 },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const parsed = restaurantStaffSignUpSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload" },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const requiredCode = process.env.RESTAURANT_SIGNUP_CODE?.trim();
  if (requiredCode && (data.enrollmentCode?.trim() ?? "") !== requiredCode) {
    return NextResponse.json({ error: "Invalid enrollment code" }, { status: 400 });
  }

  const restaurantId = `rest_${randomUUID()}`;
  const termsAcceptedAt = new Date().toISOString();
  const ip = clientIp(request);

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: created, error } = await admin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    user_metadata: {
      display_name: data.name.trim(),
      app_role: "restaurant_staff",
      restaurant_id: restaurantId,
      restaurant_application_status: "pending_verification",
      contact_name: data.name.trim(),
      business_legal_name: data.businessLegalName.trim(),
      business_address: data.businessAddress.trim(),
      business_email: data.businessEmail.trim(),
      business_phone: data.businessPhone.trim(),
      food_service_type: data.foodServiceType,
      food_service_attested: true,
      terms_accepted_at: termsAcceptedAt,
      verified_email: false,
      verified_phone: false,
      ...(data.businessRegistrationId?.trim()
        ? { business_registration_id: data.businessRegistrationId.trim() }
        : {}),
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const userId = created.user?.id;
  if (userId) {
    try {
      await upsertRestaurantRegistryEntry(restaurantId, {
        businessLegalName: data.businessLegalName.trim(),
        businessAddress: data.businessAddress.trim(),
        businessEmail: data.businessEmail.trim(),
        contactName: data.name.trim(),
        foodServiceType: data.foodServiceType,
        signupUserId: userId,
        signupIp: ip,
        createdAt: new Date().toISOString(),
      });
    } catch (registryError) {
      console.error("Restaurant registry write failed after signup", registryError);
    }
  }

  return NextResponse.json({ ok: true, restaurantId }, { status: 201 });
}
