import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { listings as seedListings } from "@/lib/marketplace";
import { createRunExclusive } from "@/lib/file-queue";
import type { ListingInput } from "@/lib/validation";
import type { ListingItem } from "@/lib/marketplace";

const DATA_DIR = path.join(process.cwd(), ".nowaste-data");
const LISTINGS_FILE = path.join(DATA_DIR, "listings.json");
const SEED_INVENTORY_FILE = path.join(DATA_DIR, "seed-inventory.json");
const MAX_INVENTORY_FILE = path.join(DATA_DIR, "max-inventory.json");

const runExclusive = createRunExclusive();

type SeedInventoryOverrides = Record<string, number>;
type MaxInventoryMap = Record<string, number>;

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return fallback;
    console.error(`Failed reading JSON at ${filePath}:`, err.message);
    throw err;
  }
}

async function readPersistedListings(): Promise<ListingItem[]> {
  const parsed = await readJsonFile<ListingItem[]>(LISTINGS_FILE, []);
  return Array.isArray(parsed) ? parsed : [];
}

async function readSeedInventoryOverrides(): Promise<SeedInventoryOverrides> {
  const parsed = await readJsonFile<SeedInventoryOverrides>(SEED_INVENTORY_FILE, {});
  return typeof parsed === "object" && parsed ? parsed : {};
}

async function readMaxInventoryMap(): Promise<MaxInventoryMap> {
  const parsed = await readJsonFile<MaxInventoryMap>(MAX_INVENTORY_FILE, {});
  return typeof parsed === "object" && parsed ? parsed : {};
}

function applySeedOverrides(overrides: SeedInventoryOverrides): ListingItem[] {
  return seedListings.map((listing) => ({
    ...listing,
    quantityRemaining:
      typeof overrides[listing.id] === "number" ? overrides[listing.id] : listing.quantityRemaining,
  }));
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

async function writePersistedListings(next: ListingItem[]) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(LISTINGS_FILE, JSON.stringify(next, null, 2), "utf8");
}

async function writeSeedInventoryOverrides(next: SeedInventoryOverrides) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(SEED_INVENTORY_FILE, JSON.stringify(next, null, 2), "utf8");
}

async function writeMaxInventoryMap(next: MaxInventoryMap) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(MAX_INVENTORY_FILE, JSON.stringify(next, null, 2), "utf8");
}

function getSeedMaxInventory(id: string): number | null {
  const seed = seedListings.find((listing) => listing.id === id);
  return seed ? seed.quantityRemaining : null;
}

export async function saveListing(input: {
  values: ListingInput;
  restaurantId: string;
  restaurantName: string;
  distanceMiles: number;
}): Promise<ListingItem> {
  return runExclusive(async () => {
    const created = buildListing(input);
    const persisted = await readPersistedListings();
    await writePersistedListings([created, ...persisted]);

    const maxMap = await readMaxInventoryMap();
    maxMap[created.id] = created.quantityRemaining;
    await writeMaxInventoryMap(maxMap);

    return created;
  });
}

export async function listPersistedListings(): Promise<ListingItem[]> {
  return runExclusive(async () => readPersistedListings());
}

export async function listAllListings(): Promise<ListingItem[]> {
  return runExclusive(async () => {
    const persisted = await readPersistedListings();
    const overrides = await readSeedInventoryOverrides();
    const seeded = applySeedOverrides(overrides);

    const seen = new Set<string>();
    return [...persisted, ...seeded].filter((listing) => {
      if (seen.has(listing.id)) return false;
      seen.add(listing.id);
      return true;
    });
  });
}

export async function getListingByIdFromStore(id: string): Promise<ListingItem | null> {
  const all = await listAllListings();
  return all.find((listing) => listing.id === id) ?? null;
}

export async function reserveListingQuantityById(id: string, quantity: number): Promise<ListingItem | null> {
  if (!Number.isInteger(quantity) || quantity < 1) return null;

  return runExclusive(async () => {
    const persisted = await readPersistedListings();
    const persistedIndex = persisted.findIndex((listing) => listing.id === id);

    if (persistedIndex >= 0) {
      const listing = persisted[persistedIndex];
      if (listing.quantityRemaining < quantity) return null;
      const updated = {
        ...listing,
        quantityRemaining: listing.quantityRemaining - quantity,
      };
      const next = [...persisted];
      next[persistedIndex] = updated;
      await writePersistedListings(next);
      return updated;
    }

    const seedListing = seedListings.find((listing) => listing.id === id);
    if (!seedListing) return null;

    const overrides = await readSeedInventoryOverrides();
    const currentQty =
      typeof overrides[id] === "number" ? overrides[id] : seedListing.quantityRemaining;
    if (currentQty < quantity) return null;

    const nextQty = currentQty - quantity;
    overrides[id] = nextQty;
    await writeSeedInventoryOverrides(overrides);

    return {
      ...seedListing,
      quantityRemaining: nextQty,
    };
  });
}

export async function restoreListingQuantityById(id: string, quantity: number): Promise<ListingItem | null> {
  if (!Number.isInteger(quantity) || quantity < 1) return null;

  return runExclusive(async () => {
    const persisted = await readPersistedListings();
    const persistedIndex = persisted.findIndex((listing) => listing.id === id);
    const maxMap = await readMaxInventoryMap();

    if (persistedIndex >= 0) {
      const listing = persisted[persistedIndex];
      const maxQty = typeof maxMap[id] === "number" ? maxMap[id] : listing.quantityRemaining;
      if (listing.quantityRemaining >= maxQty) return listing;

      const nextQty = Math.min(listing.quantityRemaining + quantity, maxQty);
      const updated = {
        ...listing,
        quantityRemaining: nextQty,
      };
      const next = [...persisted];
      next[persistedIndex] = updated;
      await writePersistedListings(next);
      return updated;
    }

    const seedListing = seedListings.find((listing) => listing.id === id);
    if (!seedListing) return null;

    const overrides = await readSeedInventoryOverrides();
    const currentQty =
      typeof overrides[id] === "number" ? overrides[id] : seedListing.quantityRemaining;
    const maxQty = getSeedMaxInventory(id) ?? currentQty;

    if (currentQty >= maxQty) {
      return { ...seedListing, quantityRemaining: currentQty };
    }

    const nextQty = Math.min(currentQty + quantity, maxQty);
    overrides[id] = nextQty;
    await writeSeedInventoryOverrides(overrides);

    return {
      ...seedListing,
      quantityRemaining: nextQty,
    };
  });
}
