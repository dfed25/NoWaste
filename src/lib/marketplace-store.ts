import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ListingInput } from "@/lib/validation";
import type { ListingItem } from "@/lib/marketplace";

const DATA_DIR = path.join(process.cwd(), ".nowaste-data");
const LISTINGS_FILE = path.join(DATA_DIR, "listings.json");
let writeQueue: Promise<unknown> = Promise.resolve();

function runExclusive<T>(operation: () => Promise<T>) {
  const next = writeQueue.then(operation, operation);
  writeQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

async function readPersistedListings(): Promise<ListingItem[]> {
  try {
    const raw = await readFile(LISTINGS_FILE, "utf8");
    const parsed = JSON.parse(raw) as ListingItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return [];
    console.error(`Failed reading persisted listings at ${LISTINGS_FILE}:`, err.message);
    throw err;
  }
}

function buildListing(input: {
  values: ListingInput;
  restaurantId: string;
  restaurantName: string;
  distanceMiles: number;
}): ListingItem {
  return {
    id: `l_${randomUUID()}`,
    title: input.values.title,
    description: input.values.description,
    restaurantId: input.restaurantId,
    restaurantName: input.restaurantName,
    distanceMiles: input.distanceMiles,
    pickupWindowStart: new Date(input.values.pickupWindowStart).toISOString(),
    pickupWindowEnd: new Date(input.values.pickupWindowEnd).toISOString(),
    dietary: [],
    priceCents: input.values.discountedPriceCents,
    quantityRemaining: input.values.quantityTotal,
    allergyNotes: input.values.allergyNotes,
  };
}

async function persistCreatedListing(created: ListingItem) {
  const persisted = await readPersistedListings();
  const next = [created, ...persisted];
  await writePersistedListings(next);
}

export async function saveListing(input: {
  values: ListingInput;
  restaurantId: string;
  restaurantName: string;
  distanceMiles: number;
}): Promise<ListingItem> {
  return runExclusive(async () => {
    const created = buildListing(input);
    await persistCreatedListing(created);
    return created;
  });
}

async function writePersistedListings(next: ListingItem[]) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(LISTINGS_FILE, JSON.stringify(next, null, 2), "utf8");
}

