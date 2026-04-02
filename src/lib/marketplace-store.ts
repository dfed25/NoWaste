import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ListingInput } from "@/lib/validation";
import type { ListingItem } from "@/lib/marketplace";

const DATA_DIR = path.join(process.cwd(), ".nowaste-data");
const LISTINGS_FILE = path.join(DATA_DIR, "listings.json");

async function readPersistedListings(): Promise<ListingItem[]> {
  try {
    const raw = await readFile(LISTINGS_FILE, "utf8");
    const parsed = JSON.parse(raw) as ListingItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writePersistedListings(next: ListingItem[]) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(LISTINGS_FILE, JSON.stringify(next, null, 2), "utf8");
}

export async function saveListing(input: {
  values: ListingInput;
  restaurantId: string;
  restaurantName: string;
  distanceMiles: number;
}): Promise<ListingItem> {
  const created: ListingItem = {
    id: `l_${Date.now()}`,
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

  const persisted = await readPersistedListings();
  const next = [created, ...persisted];
  await writePersistedListings(next);
  return created;
}

