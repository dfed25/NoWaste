import { mkdir, open, readFile, rename, rm } from "node:fs/promises";
import path from "node:path";
import { createRunExclusive } from "@/lib/file-queue";
import { createDefaultNotificationPreferences } from "@/lib/notifications";
import type { NotificationPreferenceInput } from "@/lib/validation";

const DATA_DIR = path.join(process.cwd(), ".nowaste-data");
const PREFERENCES_FILE = path.join(DATA_DIR, "notification-preferences.json");
const runExclusive = createRunExclusive();

type PreferencesMap = Record<string, NotificationPreferenceInput & { updatedAt: string }>;

async function readPreferences(): Promise<PreferencesMap> {
  try {
    const raw = await readFile(PREFERENCES_FILE, "utf8");
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
      return parsed as PreferencesMap;
    } catch {
      console.error(`Malformed JSON in ${PREFERENCES_FILE}, returning empty preferences`);
      return {};
    }
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return {};
    console.error(`Failed reading notification preferences at ${PREFERENCES_FILE}:`, err.message);
    throw err;
  }
}

async function writePreferences(next: PreferencesMap) {
  await mkdir(DATA_DIR, { recursive: true });
  const tempFile = `${PREFERENCES_FILE}.tmp-${process.pid}`;
  const payload = JSON.stringify(next, null, 2);
  let handle: Awaited<ReturnType<typeof open>> | null = null;

  try {
    handle = await open(tempFile, "w");
    await handle.writeFile(payload, "utf8");
    await handle.sync();
    await handle.close();
    handle = null;
    await rename(tempFile, PREFERENCES_FILE);
  } finally {
    if (handle) {
      await handle.close().catch(() => undefined);
    }
    await rm(tempFile, { force: true }).catch(() => undefined);
  }
}

export async function getNotificationPreferences(userId: string): Promise<NotificationPreferenceInput> {
  return runExclusive(async () => {
    const map = await readPreferences();
    const current = map[userId];
    if (!current) {
      return {
        ...createDefaultNotificationPreferences(),
        userId,
      };
    }

    return {
      userId,
      email: Boolean(current.email),
      sms: Boolean(current.sms),
      events: Array.isArray(current.events) ? current.events : [],
    };
  });
}

export async function saveNotificationPreferences(
  userId: string,
  preference: NotificationPreferenceInput,
): Promise<NotificationPreferenceInput> {
  return runExclusive(async () => {
    const map = await readPreferences();
    const next: NotificationPreferenceInput = {
      userId,
      email: preference.email,
      sms: preference.sms,
      events: preference.events,
    };

    map[userId] = {
      ...next,
      updatedAt: new Date().toISOString(),
    };

    await writePreferences(map);
    return next;
  });
}
