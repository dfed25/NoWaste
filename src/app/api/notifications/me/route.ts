import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCustomerIdCookieName, parseSignedCustomerId } from "@/lib/customer-id-cookie";
import {
  clearReadNotificationsForUser,
  dismissNotificationForUser,
  getUnreadNotificationCount,
  listInAppNotificationsForUser,
  markAllNotificationsReadForUser,
  markNotificationReadForUser,
  markNotificationUnreadForUser,
} from "@/lib/notification-center-store";

type ReadBody = {
  notificationId?: string;
  markAll?: boolean;
  markUnread?: boolean;
  dismiss?: boolean;
  clearRead?: boolean;
};

function parseReadBody(value: unknown): ReadBody {
  if (!value || typeof value !== "object") return {};
  const input = value as Partial<ReadBody>;
  return {
    notificationId: typeof input.notificationId === "string" ? input.notificationId : undefined,
    markAll: input.markAll === true,
    markUnread: input.markUnread === true,
    dismiss: input.dismiss === true,
    clearRead: input.clearRead === true,
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
    return NextResponse.json(
      { notifications: [], unreadCount: 0, readCount: 0, totalCount: 0 },
      { status: 200 },
    );
  }

  try {
    const [notifications, unreadCount] = await Promise.all([
      listInAppNotificationsForUser(customerId),
      getUnreadNotificationCount(customerId),
    ]);

    const totalCount = notifications.length;
    const readCount = Math.max(0, totalCount - unreadCount);

    return NextResponse.json(
      { notifications, unreadCount, readCount, totalCount },
      { status: 200 },
    );
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

  const explicitActionCount = [
    parsed.markAll,
    parsed.clearRead,
    parsed.dismiss,
    parsed.markUnread,
  ].filter(Boolean).length;

  if (explicitActionCount > 1) {
    return NextResponse.json(
      { error: "Specify exactly one notification action" },
      { status: 400 },
    );
  }

  try {
    if (parsed.markAll) {
      const updatedCount = await markAllNotificationsReadForUser(customerId);
      return NextResponse.json({ ok: true, updatedCount }, { status: 200 });
    }

    if (parsed.clearRead) {
      const updatedCount = await clearReadNotificationsForUser(customerId);
      return NextResponse.json({ ok: true, updatedCount }, { status: 200 });
    }

    if (!parsed.notificationId) {
      return NextResponse.json(
        { error: "notificationId is required for this action" },
        { status: 400 },
      );
    }

    if (parsed.dismiss) {
      const updated = await dismissNotificationForUser(customerId, parsed.notificationId);
      if (!updated) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, notification: updated }, { status: 200 });
    }

    if (parsed.markUnread) {
      const updated = await markNotificationUnreadForUser(customerId, parsed.notificationId);
      if (!updated) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, notification: updated }, { status: 200 });
    }

    const updated = await markNotificationReadForUser(customerId, parsed.notificationId);
    if (!updated) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, notification: updated }, { status: 200 });
  } catch (error) {
    console.error("Failed to update notifications", { customerId, error });
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}
