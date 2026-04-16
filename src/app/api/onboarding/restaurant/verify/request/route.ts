import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseUserFromAccessToken } from "@/lib/supabase-access-token";
import { issueRestaurantVerificationCode } from "@/lib/restaurant-verification-codes";

const bodySchema = z
  .object({
    access_token: z.string().min(1),
    channel: z.enum(["email", "sms"]),
  })
  .strict();

/**
 * MVP: issues a short-lived code and logs the destination + code server-side.
 * Set VERIFICATION_CODE_DEBUG=1 to include the code in the JSON response (local QA only).
 */
export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
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

  const meta = user.user_metadata as Record<string, unknown> | undefined;
  if (meta?.app_role !== "restaurant_staff") {
    return NextResponse.json({ error: "Restaurant staff only" }, { status: 403 });
  }

  const rawStatus =
    typeof meta?.restaurant_application_status === "string"
      ? meta.restaurant_application_status.trim()
      : "";
  if (rawStatus !== "pending_verification") {
    return NextResponse.json(
      { error: "Verification is not required for the current application status." },
      { status: 409 },
    );
  }

  const channel = parsed.data.channel === "email" ? ("email" as const) : ("sms" as const);
  const { plainCode } = await issueRestaurantVerificationCode(user.id, channel);

  const businessEmail = typeof meta?.business_email === "string" ? meta.business_email : "";
  const businessPhone = typeof meta?.business_phone === "string" ? meta.business_phone : "";

  console.info(
    `[restaurant-verify] user=${user.id} channel=${channel} code=${plainCode} to=${
      channel === "email" ? businessEmail : businessPhone
    }`,
  );

  const debug = process.env.VERIFICATION_CODE_DEBUG === "1";
  return NextResponse.json(
    {
      ok: true,
      expiresInMinutes: 15,
      ...(debug ? { debugCode: plainCode } : {}),
    },
    { status: 200 },
  );
}
