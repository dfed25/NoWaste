import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { restaurantStaffSignUpSchema } from "@/lib/validation";

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

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await admin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    user_metadata: {
      display_name: data.name.trim(),
      app_role: "restaurant_staff",
      business_legal_name: data.businessLegalName.trim(),
      business_phone: data.businessPhone.trim(),
      food_service_attested: true,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
