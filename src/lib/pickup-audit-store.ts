import "server-only";
import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { mkdir, open, readFile, rename, rm, unlink } from "node:fs/promises";
import path from "node:path";
import type { PickupAuditEvent, PickupEventType } from "@/lib/pickup";

/**
 * Append-only pickup audit trail in `.nowaste-data/pickup-audit.json`.
 * Mutations run under a cross-process lock (`pickup-audit.json.lock`) so read-check-write is atomic.
 */

const DATA_DIR = path.join(process.cwd(), ".nowaste-data");
const AUDIT_FILE = path.join(DATA_DIR, "pickup-audit.json");
const LOCK_FILE = `${AUDIT_FILE}.lock`;
const LOCK_WAIT_MS = 15_000;
const LOCK_POLL_MS = 15;

export type StoredPickupAuditEvent = PickupAuditEvent & { restaurantId: string };

const VALID_ACTORS = new Set<PickupAuditEvent["actor"]>(["restaurant", "customer", "system"]);
const VALID_TYPES = new Set<PickupEventType>([
  "code_verified",
  "picked_up",
  "missed_pickup",
  "expired",
  "canceled",
]);

type FileShape = { events: StoredPickupAuditEvent[] };

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/** Only removes a lock file when the recorded pid is not running (avoids stealing an active holder). */
async function tryRemoveDeadOwnerLock(): Promise<void> {
  let raw: string;
  try {
    raw = await readFile(LOCK_FILE, "utf8");
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return;
    throw error;
  }
  const pid = Number.parseInt(raw.trim(), 10);
  if (Number.isFinite(pid) && pid > 0 && isProcessAlive(pid)) {
    return;
  }
  await unlink(LOCK_FILE).catch(() => undefined);
}

async function withPickupAuditFileLock<T>(operation: () => Promise<T>): Promise<T> {
  await mkdir(DATA_DIR, { recursive: true });
  const deadline = Date.now() + LOCK_WAIT_MS;
  let lockHandle: Awaited<ReturnType<typeof open>> | null = null;

  while (Date.now() < deadline) {
    try {
      lockHandle = await open(LOCK_FILE, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY);
      break;
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== "EEXIST") throw error;
      await tryRemoveDeadOwnerLock();
      await delay(LOCK_POLL_MS);
    }
  }

  if (!lockHandle) {
    throw new Error("pickup_audit_lock_timeout");
  }

  try {
    await lockHandle.writeFile(String(process.pid), "utf8");
    return await operation();
  } finally {
    await lockHandle.close().catch(() => undefined);
    await unlink(LOCK_FILE).catch(() => undefined);
  }
}

async function readFileShape(): Promise<FileShape> {
  try {
    const raw = await readFile(AUDIT_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return { events: [] };
    const events = (parsed as { events?: unknown }).events;
    if (!Array.isArray(events)) return { events: [] };
    return { events: events.filter(isStoredEvent) };
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return { events: [] };
    throw err;
  }
}

function isStoredEvent(value: unknown): value is StoredPickupAuditEvent {
  if (!value || typeof value !== "object") return false;
  const e = value as Record<string, unknown>;
  if (
    typeof e.id !== "string" ||
    typeof e.orderId !== "string" ||
    typeof e.actor !== "string" ||
    typeof e.type !== "string" ||
    typeof e.at !== "string" ||
    typeof e.restaurantId !== "string"
  ) {
    return false;
  }
  if (!VALID_ACTORS.has(e.actor as PickupAuditEvent["actor"])) return false;
  if (!VALID_TYPES.has(e.type as PickupEventType)) return false;
  if (e.note !== undefined && typeof e.note !== "string") return false;
  return true;
}

async function writeFileShape(data: FileShape) {
  await mkdir(DATA_DIR, { recursive: true });
  const tempFile = `${AUDIT_FILE}.${randomUUID()}.tmp`;
  let handle: Awaited<ReturnType<typeof open>> | null = null;
  try {
    handle = await open(tempFile, "w");
    await handle.writeFile(JSON.stringify(data, null, 2), "utf8");
    await handle.sync();
    await handle.close();
    handle = null;
    await rename(tempFile, AUDIT_FILE);
  } finally {
    if (handle) await handle.close().catch(() => undefined);
    await rm(tempFile, { force: true }).catch(() => undefined);
  }
}

function matchesEvent(
  events: StoredPickupAuditEvent[],
  restaurantId: string,
  orderId: string,
  type: PickupEventType,
) {
  return events.some(
    (ev) => ev.restaurantId === restaurantId && ev.orderId === orderId && ev.type === type,
  );
}

export type TryAppendPickupAuditResult =
  | { ok: true; event: PickupAuditEvent }
  | { ok: false; duplicate: true };

/**
 * Under a cross-process lock: if no matching event exists, append and persist; otherwise duplicate.
 */
export async function tryAppendPickupAuditEvent(input: {
  restaurantId: string;
  orderId: string;
  actor: PickupAuditEvent["actor"];
  type: PickupEventType;
  note?: string;
}): Promise<TryAppendPickupAuditResult> {
  return withPickupAuditFileLock(async () => {
    const file = await readFileShape();
    if (matchesEvent(file.events, input.restaurantId, input.orderId, input.type)) {
      return { ok: false, duplicate: true };
    }
    const event: StoredPickupAuditEvent = {
      id: `evt_${randomUUID()}`,
      orderId: input.orderId,
      actor: input.actor,
      type: input.type,
      at: new Date().toISOString(),
      note: input.note,
      restaurantId: input.restaurantId,
    };
    file.events.unshift(event);
    await writeFileShape(file);
    return { ok: true, event: toPublicAuditEvent(event) };
  });
}

/** Lists events for a staff restaurant scope, or all events for admin. */
export async function listPickupAuditEventsForScope(options: {
  restaurantId: string | null;
  isAdmin: boolean;
}): Promise<PickupAuditEvent[]> {
  const file = await readFileShape();
  let rows = file.events;
  if (!options.isAdmin && options.restaurantId) {
    rows = rows.filter((e) => e.restaurantId === options.restaurantId);
  } else if (!options.isAdmin && !options.restaurantId) {
    rows = [];
  }
  const snapshot = [...rows].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );
  return snapshot.map(toPublicAuditEvent);
}

function toPublicAuditEvent(entry: StoredPickupAuditEvent): PickupAuditEvent {
  return {
    id: entry.id,
    orderId: entry.orderId,
    actor: entry.actor,
    type: entry.type,
    at: entry.at,
    note: entry.note,
  };
}
