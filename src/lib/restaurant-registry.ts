import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, open, readFile, rename, rm } from "node:fs/promises";
import path from "node:path";
import { createRunExclusive } from "@/lib/file-queue";

const DATA_DIR = path.join(process.cwd(), ".nowaste-data");
const FILE = path.join(DATA_DIR, "restaurant-registry.json");

const runExclusive = createRunExclusive();

export type RestaurantRegistryEntry = {
  businessLegalName: string;
  businessAddress: string;
  businessEmail: string;
  contactName: string;
  foodServiceType: string;
  signupUserId: string;
  signupIp?: string;
  createdAt: string;
};

type FileShape = Record<string, RestaurantRegistryEntry>;

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

export async function getRestaurantRegistryEntry(restaurantId: string): Promise<RestaurantRegistryEntry | null> {
  const all = await readAll();
  return all[restaurantId] ?? null;
}

export async function upsertRestaurantRegistryEntry(
  restaurantId: string,
  entry: RestaurantRegistryEntry,
): Promise<void> {
  await runExclusive(async () => {
    const all = await readAll();
    all[restaurantId] = entry;
    await writeAll(all);
  });
}
