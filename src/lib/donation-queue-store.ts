/**
 * File-backed donation queue per restaurant id.
 *
 * Writes are serialized only within this Node process; `.nowaste-data` is local
 * disk. Do not rely on this for multi-replica or ephemeral hosting without a
 * shared store (e.g. Postgres/Redis) and appropriate locking.
 */
import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, open, readFile, rename, rm } from "node:fs/promises";
import path from "node:path";
import { createRunExclusive } from "@/lib/file-queue";
import type { DonationReadyItem } from "@/lib/donation";

const DATA_DIR = path.join(process.cwd(), ".nowaste-data");
const FILE = path.join(DATA_DIR, "donation-queues.json");

const runExclusive = createRunExclusive();

type FileShape = Record<string, DonationReadyItem[]>;

async function readAll(): Promise<FileShape> {
  try {
    const raw = await readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as FileShape;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return {};
    throw err;
  }
}

async function writeAll(data: FileShape) {
  await mkdir(DATA_DIR, { recursive: true });
  const tempFile = `${FILE}.${randomUUID()}.tmp`;
  let handle: Awaited<ReturnType<typeof open>> | null = null;
  try {
    handle = await open(tempFile, "w");
    await handle.writeFile(JSON.stringify(data, null, 2), "utf8");
    await handle.sync();
    await handle.close();
    handle = null;
    await rename(tempFile, FILE);
  } finally {
    if (handle) await handle.close().catch(() => undefined);
    await rm(tempFile, { force: true }).catch(() => undefined);
  }
}

export async function getDonationQueue(restaurantId: string): Promise<DonationReadyItem[]> {
  const all = await readAll();
  const q = all[restaurantId];
  return Array.isArray(q) ? q : [];
}

export async function setDonationQueue(
  restaurantId: string,
  queue: DonationReadyItem[],
): Promise<void> {
  return runExclusive(async () => {
    const all = await readAll();
    all[restaurantId] = queue;
    await writeAll(all);
  });
}
