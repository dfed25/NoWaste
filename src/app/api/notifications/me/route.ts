import { NextResponse } from "next/server";
import {
  clearReadNotificationsForUser,
  dismissNotificationForUser,
  listNotificationsForUser,
  markAllNotificationsReadForUser,
  markNotificationReadForUser,
  markNotificationUnreadForUser,
} from "@/lib/notification-center-store";
import { resolveCustomer, withCustomerCookie } from "@/lib/customer-cookie-utils";

type NotificationsPatchBody = {
  notificationId?: string;
  markAll?: boolean;
  markUnread?: boolean;
  dismiss?: boolean;
  clearRead?: boolean;
};

export async function GET(request: Request) {
  const resolved = await resolveCustomer(request);

  try {
    const notifications = await listNotificationsForUser(resolved.customerId);
    const unreadCount = notifications.filter((item) => !item.readAt).length;
    const readCount = notifications.length - unreadCount;

    const response = NextResponse.json(
      {
        notifications,
        unreadCount,
        readCount,
        totalCount: notifications.length,
      },
      { status: 200 },
    );

    return withCustomerCookie(response, resolved.customerId, resolved.shouldSetCookie);
  } catch (error) {
    console.error("Failed to fetch notifications", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const resolved = await resolveCustomer(request);

  let body: NotificationsPatchBody;
  try {
    body = (await request.json()) as NotificationsPatchBody;
  } catch {
    return NextResponse.json({ error: "Malformed JSON payload" }, { status: 400 });
  }

  const explicitActionCount = [
    Boolean(body.markAll),
    Boolean(body.clearRead),
    Boolean(body.dismiss),
    Boolean(body.markUnread),
  ].filter(Boolean).length;
  if (explicitActionCount > 1) {
    return NextResponse.json({ error: "Provide only one action per request" }, { status: 400 });
  }

  try {
    if (body.markAll) {
      await markAllNotificationsReadForUser(resolved.customerId);
    } else if (body.clearRead) {
      await clearReadNotificationsForUser(resolved.customerId);
    } else if (body.notificationId && body.dismiss) {
      const ok = await dismissNotificationForUser(resolved.customerId, body.notificationId);
      if (!ok) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 });
      }
    } else if (body.notificationId && body.markUnread) {
      const ok = await markNotificationUnreadForUser(resolved.customerId, body.notificationId);
      if (!ok) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 });
      }
    } else if (body.notificationId) {
      const ok = await markNotificationReadForUser(resolved.customerId, body.notificationId);
      if (!ok) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 });
      }
    } else {
      return NextResponse.json({ error: "No notification action provided" }, { status: 400 });
    }

    const notifications = await listNotificationsForUser(resolved.customerId);
    const unreadCount = notifications.filter((item) => !item.readAt).length;
    const readCount = notifications.length - unreadCount;

    const response = NextResponse.json(
      {
        ok: true,
        notifications,
        unreadCount,
        readCount,
        totalCount: notifications.length,
      },
      { status: 200 },
    );

    return withCustomerCookie(response, resolved.customerId, resolved.shouldSetCookie);
  } catch (error) {
    console.error("Failed to mutate notifications", error);
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}
