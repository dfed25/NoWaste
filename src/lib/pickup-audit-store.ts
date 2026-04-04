import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, open, readFile, rename, rm } from "node:fs/promises";
import path from "node:path";
import { createRunExclusive } from "@/lib/file-queue";
import type { PickupAuditEvent, PickupEventType } from "@/lib/pickup";

const DATA_DIR = path.join(process.cwd(), ".nowaste-data");
const AUDIT_FILE = path.join(DATA_DIR, "pickup-audit.json");

export type StoredPickupAuditEvent = PickupAuditEvent & { restaurantId: string };

const runExclusive = createRunExclusive();

const VALID_ACTORS = new Set<PickupAuditEvent["actor"]>(["restaurant", "customer", "system"]);
const VALID_TYPES = new Set<PickupEventType>([
  "code_verified",
  "picked_up",
  "missed_pickup",
  "expired",
  "canceled",
]);

type FileShape = { events: StoredPickupAuditEvent[] };

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

export async function hasPickupAuditEvent(
  restaurantId: string,
  orderId: string,
  type: PickupEventType,
): Promise<boolean> {
  const file = await readFileShape();
  return file.events.some(
    (ev) => ev.restaurantId === restaurantId && ev.orderId === orderId && ev.type === type,
  );
}

export async function appendPickupAuditEvent(input: {
  restaurantId: string;
  orderId: string;
  actor: PickupAuditEvent["actor"];
  type: PickupEventType;
  note?: string;
}): Promise<PickupAuditEvent> {
  return runExclusive(async () => {
    const file = await readFileShape();
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
    return toPublicAuditEvent(event);
  });
}

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
