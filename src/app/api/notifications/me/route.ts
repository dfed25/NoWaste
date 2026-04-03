import { NextResponse } from "next/server";
import { z } from "zod";
import {
  clearReadNotificationsForUser,
  dismissNotificationForUser,
  listNotificationsForUser,
  markAllNotificationsReadForUser,
  markNotificationReadForUser,
  markNotificationUnreadForUser,
} from "@/lib/notification-center-store";
import { resolveCustomer, withCustomerCookie } from "@/lib/customer-cookie-utils";

const notificationsPatchSchema = z
  .object({
    notificationId: z.string().optional(),
    markAll: z.boolean().optional(),
    markUnread: z.boolean().optional(),
    dismiss: z.boolean().optional(),
    clearRead: z.boolean().optional(),
  })
  .strict();

type NotificationsPatchBody = z.infer<typeof notificationsPatchSchema>;

export async function GET(request: Request) {
  let resolved: { customerId: string; shouldSetCookie: boolean };
  try {
    resolved = await resolveCustomer(request);
  } catch (error) {
    console.error("Failed resolving customer for notifications", error);
    return NextResponse.json({ error: "Account is temporarily unavailable" }, { status: 503 });
  }

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

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON payload" }, { status: 400 });
  }

  const parsedBody = notificationsPatchSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const body: NotificationsPatchBody = parsedBody.data;

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
