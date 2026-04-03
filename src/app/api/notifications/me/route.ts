import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCustomerIdCookieName, parseSignedCustomerId } from "@/lib/customer-id-cookie";
import {
  getUnreadNotificationCount,
  listInAppNotificationsForUser,
  markAllNotificationsReadForUser,
  markNotificationReadForUser,
} from "@/lib/notification-center-store";

type ReadBody = {
  notificationId?: string;
  markAll?: boolean;
};

function parseReadBody(value: unknown): ReadBody {
  if (!value || typeof value !== "object") return {};
  const input = value as Partial<ReadBody>;
  return {
    notificationId: typeof input.notificationId === "string" ? input.notificationId : undefined,
    markAll: input.markAll === true,
  };
}

async function resolveCustomerId() {
  const cookieStore = await cookies();
  const rawCustomerCookie = cookieStore.get(getCustomerIdCookieName())?.value;
  return parseSignedCustomerId(rawCustomerCookie);
}

export async function GET() {
  const customerId = await resolveCustomerId();
  if (!customerId) {
    return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 200 });
  }

  try {
    const [notifications, unreadCount] = await Promise.all([
      listInAppNotificationsForUser(customerId),
      getUnreadNotificationCount(customerId),
    ]);

    return NextResponse.json({ notifications, unreadCount }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch in-app notifications", { customerId, error });
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const customerId = await resolveCustomerId();
  if (!customerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON payload" }, { status: 400 });
  }

  const parsed = parseReadBody(body);

  try {
    if (parsed.markAll) {
      const updatedCount = await markAllNotificationsReadForUser(customerId);
      return NextResponse.json({ ok: true, updatedCount }, { status: 200 });
    }

    if (!parsed.notificationId) {
      return NextResponse.json(
        { error: "notificationId is required when markAll is false" },
        { status: 400 },
      );
    }

    const updated = await markNotificationReadForUser(customerId, parsed.notificationId);
    if (!updated) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, notification: updated }, { status: 200 });
  } catch (error) {
    console.error("Failed to mark notifications as read", { customerId, error });
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}
