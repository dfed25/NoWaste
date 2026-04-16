import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  RESTAURANT_APPLICATION_STATUSES,
  type RestaurantApplicationStatus,
} from "@/lib/restaurant-application-status";
import { verifyServerSession } from "@/lib/server-session";

function requireAdmin(request: Request) {
  const session = verifyServerSession(request);
  if (!session.isAuthenticated || session.user?.role !== "admin") {
    return null;
  }
  return session;
}

const postSchema = z
  .object({
    userId: z.string().min(1),
    action: z.enum(["approve", "reject", "suspend"]),
  })
  .strict();

export async function GET(request: Request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Admin API is not configured." }, { status: 503 });
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  type Row = {
    userId: string;
    email: string | undefined;
    restaurantId: string | undefined;
    businessLegalName: string | undefined;
    status: RestaurantApplicationStatus | null;
    createdAt: string | undefined;
  };

  const rows: Row[] = [];
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const users = data.users ?? [];
    for (const u of users) {
      const meta = u.user_metadata as Record<string, unknown> | undefined;
      if (meta?.app_role !== "restaurant_staff") continue;
      const stRaw = meta?.restaurant_application_status;
      const status =
        typeof stRaw === "string" && (RESTAURANT_APPLICATION_STATUSES as readonly string[]).includes(stRaw)
          ? (stRaw as RestaurantApplicationStatus)
          : null;
      rows.push({
        userId: u.id,
        email: u.email,
        restaurantId: typeof meta?.restaurant_id === "string" ? meta.restaurant_id : undefined,
        businessLegalName:
          typeof meta?.business_legal_name === "string" ? meta.business_legal_name : undefined,
        status,
        createdAt: u.created_at ?? undefined,
      });
    }
    if (users.length < perPage) break;
    page += 1;
    if (page > 25) break;
  }

  const pending = rows.filter(
    (r) => r.status === "pending_approval" || r.status === "pending_verification",
  );

  return NextResponse.json({ applications: rows, pending }, { status: 200 });
}

export async function POST(request: Request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Admin API is not configured." }, { status: 503 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const parsed = postSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid body" }, { status: 400 });
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: fresh, error: loadError } = await admin.auth.admin.getUserById(parsed.data.userId);
  if (loadError || !fresh.user) {
    return NextResponse.json({ error: loadError?.message ?? "User not found" }, { status: 404 });
  }

  const meta = (fresh.user.user_metadata ?? {}) as Record<string, unknown>;
  if (meta.app_role !== "restaurant_staff") {
    return NextResponse.json({ error: "Not a restaurant staff account" }, { status: 400 });
  }

  const nextStatus: RestaurantApplicationStatus =
    parsed.data.action === "approve"
      ? "approved"
      : parsed.data.action === "reject"
        ? "rejected"
        : "suspended";

  const merged = { ...meta, restaurant_application_status: nextStatus };

  const { error: updateError } = await admin.auth.admin.updateUserById(parsed.data.userId, {
    user_metadata: merged,
  });

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, restaurant_application_status: nextStatus }, { status: 200 });
}
