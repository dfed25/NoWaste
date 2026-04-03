import { randomUUID } from "node:crypto";
import { mkdir, open, readFile, rename, rm } from "node:fs/promises";
import path from "node:path";
import { createRunExclusive } from "@/lib/file-queue";

export type InboxNotification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  createdAt: string;
  readAt?: string;
  dismissedAt?: string;
  linkHref?: string;
};

const DATA_DIR = path.join(process.cwd(), ".nowaste-data");
const NOTIFICATIONS_FILE = path.join(DATA_DIR, "notifications.json");
const runExclusive = createRunExclusive();

const DISMISSED_RETENTION_DAYS = 14;

type Persisted = Record<string, InboxNotification>;

async function readNotifications(): Promise<Persisted> {
  try {
    const raw = await readFile(NOTIFICATIONS_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as Persisted;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return {};
    console.error(`Failed reading notifications at ${NOTIFICATIONS_FILE}:`, err.message);
    throw err;
  }
}

async function writeNotifications(next: Persisted) {
  await mkdir(DATA_DIR, { recursive: true });
  const tempFile = `${NOTIFICATIONS_FILE}.${randomUUID()}.tmp`;
  const payload = JSON.stringify(next, null, 2);
  let handle: Awaited<ReturnType<typeof open>> | null = null;

  try {
    handle = await open(tempFile, "w");
    await handle.writeFile(payload, "utf8");
    await handle.sync();
    await handle.close();
    handle = null;
    await rename(tempFile, NOTIFICATIONS_FILE);
  } finally {
    if (handle) {
      await handle.close().catch(() => undefined);
    }
    await rm(tempFile, { force: true }).catch(() => undefined);
  }
}

function compactDismissedNotifications(map: Persisted) {
  const retentionMs = DISMISSED_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const cutoff = Date.now() - retentionMs;

  for (const [id, notification] of Object.entries(map)) {
    if (!notification.dismissedAt) continue;
    const dismissedTs = new Date(notification.dismissedAt).getTime();
    if (!Number.isFinite(dismissedTs) || dismissedTs < cutoff) {
      delete map[id];
    }
  }
}

export async function listNotificationsForUser(userId: string): Promise<InboxNotification[]> {
  return runExclusive(async () => {
    const map = await readNotifications();
    compactDismissedNotifications(map);

    const notifications = Object.values(map)
      .filter((item) => item.userId === userId && !item.dismissedAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    await writeNotifications(map);
    return notifications;
  });
}

export async function createInAppNotification(input: {
  userId: string;
  title: string;
  message: string;
  linkHref?: string;
}): Promise<InboxNotification> {
  return runExclusive(async () => {
    const map = await readNotifications();
    const created: InboxNotification = {
      id: `ntf_${randomUUID()}`,
      userId: input.userId,
      title: input.title,
      message: input.message,
      linkHref: input.linkHref,
      createdAt: new Date().toISOString(),
    };

    map[created.id] = created;
    compactDismissedNotifications(map);
    await writeNotifications(map);
    return created;
  });
}

export async function markAllNotificationsReadForUser(userId: string): Promise<void> {
  return runExclusive(async () => {
    const map = await readNotifications();
    const now = new Date().toISOString();

    for (const notification of Object.values(map)) {
      if (notification.userId !== userId) continue;
      if (notification.dismissedAt) continue;
      if (!notification.readAt) {
        notification.readAt = now;
      }
    }

    compactDismissedNotifications(map);
    await writeNotifications(map);
  });
}

export async function markNotificationReadForUser(
  userId: string,
  notificationId: string,
): Promise<boolean> {
  return runExclusive(async () => {
    const map = await readNotifications();
    if (!Object.prototype.hasOwnProperty.call(map, notificationId)) {
      return false;
    }
    const notification = map[notificationId];
    if (notification.userId !== userId || notification.dismissedAt) {
      return false;
    }

    notification.readAt = notification.readAt ?? new Date().toISOString();
    compactDismissedNotifications(map);
    await writeNotifications(map);
    return true;
  });
}

export async function markNotificationUnreadForUser(
  userId: string,
  notificationId: string,
): Promise<boolean> {
  return runExclusive(async () => {
    const map = await readNotifications();
    if (!Object.prototype.hasOwnProperty.call(map, notificationId)) {
      return false;
    }
    const notification = map[notificationId];
    if (notification.userId !== userId || notification.dismissedAt) {
      return false;
    }

    delete notification.readAt;
    compactDismissedNotifications(map);
    await writeNotifications(map);
    return true;
  });
}

export async function dismissNotificationForUser(
  userId: string,
  notificationId: string,
): Promise<boolean> {
  return runExclusive(async () => {
    const map = await readNotifications();
    if (!Object.prototype.hasOwnProperty.call(map, notificationId)) {
      return false;
    }
    const notification = map[notificationId];
    if (notification.userId !== userId || notification.dismissedAt) {
      return false;
    }

    notification.dismissedAt = new Date().toISOString();
    compactDismissedNotifications(map);
    await writeNotifications(map);
    return true;
  });
}

export async function clearReadNotificationsForUser(userId: string): Promise<void> {
  return runExclusive(async () => {
    const map = await readNotifications();

    for (const notification of Object.values(map)) {
      if (notification.userId !== userId) continue;
      if (notification.readAt && !notification.dismissedAt) {
        notification.dismissedAt = new Date().toISOString();
      }
    }

    compactDismissedNotifications(map);
    await writeNotifications(map);
  });
}
