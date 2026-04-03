import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createRunExclusive } from "@/lib/file-queue";
import {
  createDefaultNotificationPreferences,
  type NotificationPreference,
} from "@/lib/notifications";

const DATA_DIR = path.join(process.cwd(), ".nowaste-data");
const PREFERENCES_FILE = path.join(DATA_DIR, "notification-preferences.json");
const runExclusive = createRunExclusive();

type PreferencesMap = Record<string, NotificationPreference & { updatedAt: string }>;

async function readPreferences(): Promise<PreferencesMap> {
  try {
    const raw = await readFile(PREFERENCES_FILE, "utf8");
    const parsed = JSON.parse(raw) as PreferencesMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return {};
    console.error(`Failed reading notification preferences at ${PREFERENCES_FILE}:`, err.message);
    throw err;
  }
}

async function writePreferences(next: PreferencesMap) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(PREFERENCES_FILE, JSON.stringify(next, null, 2), "utf8");
}

export async function getNotificationPreferences(userId: string): Promise<NotificationPreference> {
  return runExclusive(async () => {
    const map = await readPreferences();
    const persisted = map[userId];
    if (!persisted) {
      return {
        ...createDefaultNotificationPreferences(),
        userId,
      };
    }

    return {
      userId,
      email: Boolean(persisted.email),
      sms: Boolean(persisted.sms),
      events: Array.isArray(persisted.events) ? persisted.events : [],
    };
  });
}

export async function saveNotificationPreferences(
  userId: string,
  input: NotificationPreference,
): Promise<NotificationPreference> {
  return runExclusive(async () => {
    const map = await readPreferences();
    map[userId] = {
      userId,
      email: input.email,
      sms: input.sms,
      events: [...input.events],
      updatedAt: new Date().toISOString(),
    };

    await writePreferences(map);
    return {
      userId,
      email: input.email,
      sms: input.sms,
      events: [...input.events],
    };
  });
}
