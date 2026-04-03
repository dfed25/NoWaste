import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createRunExclusive } from "@/lib/file-queue";

const DATA_DIR = path.join(process.cwd(), ".nowaste-data");
const NOTIFICATIONS_FILE = path.join(DATA_DIR, "notifications.json");
const runExclusive = createRunExclusive();

export type InAppNotification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  createdAt: string;
  readAt?: string;
  dismissedAt?: string;
  linkHref?: string;
};

type NotificationInput = {
  userId: string;
  title: string;
  message: string;
  linkHref?: string;
};

async function readPersistedNotifications(): Promise<InAppNotification[]> {
  try {
    const raw = await readFile(NOTIFICATIONS_FILE, "utf8");
    const parsed = JSON.parse(raw) as InAppNotification[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return [];
    console.error(`Failed reading notifications at ${NOTIFICATIONS_FILE}:`, err.message);
    throw err;
  }
}

async function writePersistedNotifications(next: InAppNotification[]) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(NOTIFICATIONS_FILE, JSON.stringify(next, null, 2), "utf8");
}

export async function createInAppNotification(input: NotificationInput): Promise<InAppNotification> {
  return runExclusive(async () => {
    const current = await readPersistedNotifications();
    const created: InAppNotification = {
      id: `notif_${randomUUID()}`,
      userId: input.userId,
      title: input.title,
      message: input.message,
      createdAt: new Date().toISOString(),
      linkHref: input.linkHref,
    };

    await writePersistedNotifications([created, ...current]);
    return created;
  });
}

export async function listInAppNotificationsForUser(userId: string): Promise<InAppNotification[]> {
  return runExclusive(async () => {
    const current = await readPersistedNotifications();
    return current
      .filter((item) => item.userId === userId && !item.dismissedAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const notifications = await listInAppNotificationsForUser(userId);
  return notifications.filter((item) => !item.readAt).length;
}

export async function markNotificationReadForUser(userId: string, notificationId: string) {
  return runExclusive(async () => {
    const current = await readPersistedNotifications();
    const index = current.findIndex(
      (item) => item.id === notificationId && item.userId === userId && !item.dismissedAt,
    );
    if (index < 0) return null;

    const existing = current[index];
    if (existing.readAt) return existing;

    const updated: InAppNotification = {
      ...existing,
      readAt: new Date().toISOString(),
    };

    const next = [...current];
    next[index] = updated;
    await writePersistedNotifications(next);
    return updated;
  });
}

export async function markNotificationUnreadForUser(userId: string, notificationId: string) {
  return runExclusive(async () => {
    const current = await readPersistedNotifications();
    const index = current.findIndex(
      (item) => item.id === notificationId && item.userId === userId && !item.dismissedAt,
    );
    if (index < 0) return null;

    const existing = current[index];
    if (!existing.readAt) return existing;

    const updated: InAppNotification = {
      ...existing,
      readAt: undefined,
    };

    const next = [...current];
    next[index] = updated;
    await writePersistedNotifications(next);
    return updated;
  });
}

export async function markAllNotificationsReadForUser(userId: string): Promise<number> {
  return runExclusive(async () => {
    const current = await readPersistedNotifications();
    const now = new Date().toISOString();
    let changed = 0;

    const next = current.map((item) => {
      if (item.userId !== userId || item.readAt || item.dismissedAt) return item;
      changed += 1;
      return { ...item, readAt: now };
    });

    if (changed > 0) {
      await writePersistedNotifications(next);
    }

    return changed;
  });
}

export async function dismissNotificationForUser(userId: string, notificationId: string) {
  return runExclusive(async () => {
    const current = await readPersistedNotifications();
    const index = current.findIndex(
      (item) => item.id === notificationId && item.userId === userId,
    );
    if (index < 0) return null;

    const existing = current[index];
    if (existing.dismissedAt) return existing;

    const updated: InAppNotification = {
      ...existing,
      dismissedAt: new Date().toISOString(),
    };

    const next = [...current];
    next[index] = updated;
    await writePersistedNotifications(next);
    return updated;
  });
}

export async function clearReadNotificationsForUser(userId: string): Promise<number> {
  return runExclusive(async () => {
    const current = await readPersistedNotifications();
    const now = new Date().toISOString();
    let changed = 0;

    const next = current.map((item) => {
      if (item.userId !== userId || !item.readAt || item.dismissedAt) return item;
      changed += 1;
      return { ...item, dismissedAt: now };
    });

    if (changed > 0) {
      await writePersistedNotifications(next);
    }

    return changed;
  });
}
