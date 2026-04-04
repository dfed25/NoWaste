import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, open, readFile, rename, rm } from "node:fs/promises";
import path from "node:path";
import { createRunExclusive } from "@/lib/file-queue";
import type { RestaurantOnboardingInput } from "@/lib/validation";

const DATA_DIR = path.join(process.cwd(), ".nowaste-data");
const FILE = path.join(DATA_DIR, "restaurant-onboarding.json");

const runExclusive = createRunExclusive();

type OnboardingRow = {
  data: RestaurantOnboardingInput;
  updatedAt: string;
};

type FileShape = Record<string, OnboardingRow>;

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

export async function getRestaurantOnboardingDraft(
  restaurantId: string,
): Promise<OnboardingRow | null> {
  const all = await readAll();
  return all[restaurantId] ?? null;
}

export async function saveRestaurantOnboardingDraft(
  restaurantId: string,
  data: RestaurantOnboardingInput,
): Promise<OnboardingRow> {
  return runExclusive(async () => {
    const all = await readAll();
    const row: OnboardingRow = {
      data,
      updatedAt: new Date().toISOString(),
    };
    all[restaurantId] = row;
    await writeAll(all);
    return row;
  });
}
