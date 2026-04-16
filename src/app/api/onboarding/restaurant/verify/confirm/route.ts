import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getSupabaseUserFromAccessToken } from "@/lib/supabase-access-token";
import { verifyRestaurantVerificationCode } from "@/lib/restaurant-verification-codes";

const bodySchema = z
  .object({
    access_token: z.string().min(1),
    code: z.string().trim().min(4).max(12),
  })
  .strict();

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Verification is not configured." }, { status: 503 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid body" }, { status: 400 });
  }

  const { user, error: tokenError } = await getSupabaseUserFromAccessToken(parsed.data.access_token);
  if (!user || tokenError) {
    return NextResponse.json({ error: tokenError ?? "Unauthorized" }, { status: 401 });
  }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  if (meta.app_role !== "restaurant_staff") {
    return NextResponse.json({ error: "Restaurant staff only" }, { status: 403 });
  }

  const rawStatus =
    typeof meta.restaurant_application_status === "string"
      ? meta.restaurant_application_status.trim()
      : "";
  if (rawStatus !== "pending_verification") {
    return NextResponse.json(
      { error: "Verification is not required for the current application status." },
      { status: 409 },
    );
  }

  const result = await verifyRestaurantVerificationCode(user.id, parsed.data.code);
  if (result === "invalid") {
    return NextResponse.json({ error: "Invalid verification code." }, { status: 400 });
  }
  if (result === "expired") {
    return NextResponse.json({ error: "That code has expired. Request a new one." }, { status: 410 });
  }
  if (result === "locked") {
    return NextResponse.json(
      { error: "Too many attempts. Request a new verification code." },
      { status: 429 },
    );
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: fresh, error: loadError } = await admin.auth.admin.getUserById(user.id);
  if (loadError || !fresh.user) {
    return NextResponse.json({ error: loadError?.message ?? "Could not load user" }, { status: 500 });
  }

  const merged = { ...(fresh.user.user_metadata ?? {}) } as Record<string, unknown>;
  if (result.channel === "email") {
    merged.verified_email = true;
  } else {
    merged.verified_phone = true;
  }
  merged.restaurant_application_status = "pending_approval";

  const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: merged,
  });

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, restaurant_application_status: "pending_approval" }, { status: 200 });
}
