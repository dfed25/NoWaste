import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { CUSTOMER_ID_COOKIE_NAME } from "@/lib/auth-cookies";
import { createCustomerId } from "@/lib/customer-id-cookie";
import {
  clearReadNotificationsForUser,
  dismissNotificationForUser,
  listNotificationsForUser,
  markAllNotificationsReadForUser,
  markNotificationReadForUser,
  markNotificationUnreadForUser,
} from "@/lib/notification-center-store";

type NotificationsPatchBody = {
  notificationId?: string;
  markAll?: boolean;
  markUnread?: boolean;
  dismiss?: boolean;
  clearRead?: boolean;
};

function withCustomerCookie(response: NextResponse, customerId: string, shouldSet: boolean) {
  if (!shouldSet) return response;

  response.cookies.set(CUSTOMER_ID_COOKIE_NAME, customerId, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

async function resolveCustomer(request: Request): Promise<{ customerId: string; shouldSetCookie: boolean }> {
  try {
    const cookieStore = await cookies();
    const fromCookie = cookieStore.get(CUSTOMER_ID_COOKIE_NAME)?.value;
    if (fromCookie) return { customerId: fromCookie, shouldSetCookie: false };
  } catch {
    // cookies() can fail in direct unit tests.
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${CUSTOMER_ID_COOKIE_NAME}=([^;]+)`));
  if (match?.[1]) {
    try {
      return { customerId: decodeURIComponent(match[1]), shouldSetCookie: false };
    } catch {
      return { customerId: match[1], shouldSetCookie: false };
    }
  }

  return {
    customerId: createCustomerId(),
    shouldSetCookie: true,
  };
}

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

  const explicitActionCount = [Boolean(body.markAll), Boolean(body.clearRead), Boolean(body.dismiss), Boolean(body.markUnread)].filter(Boolean).length;
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
