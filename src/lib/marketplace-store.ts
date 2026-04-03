import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ListingInput } from "@/lib/validation";
import type { ListingLifecycleStatus, ListingItem, ManagedListing } from "@/lib/marketplace";

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

async function readPersistedListings(): Promise<ManagedListing[]> {
  try {
    const raw = await readFile(LISTINGS_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => normalizeManagedListing(entry))
      .filter((entry): entry is ManagedListing => entry !== null);
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
}): ManagedListing {
  const now = new Date().toISOString();
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
    quantityTotal: input.values.quantityTotal,
    reservationCutoffAt: new Date(input.values.reservationCutoffAt).toISOString(),
    donationFallbackEnabled: input.values.donationFallbackEnabled,
    photoFileName: input.values.photoFileName?.trim() || undefined,
    listingType: input.values.listingType,
    status: "active",
    createdAt: now,
    updatedAt: now,
    allergyNotes: input.values.allergyNotes,
  };
}

type ListingScope = {
  restaurantId?: string;
};

export type ListingManagementChanges = {
  title?: string;
  description?: string;
  allergyNotes?: string;
  priceCents?: number;
  quantityTotal?: number;
  quantityRemaining?: number;
  pickupWindowStart?: string;
  pickupWindowEnd?: string;
  reservationCutoffAt?: string;
  photoFileName?: string;
  donationFallbackEnabled?: boolean;
  listingType?: "consumer" | "donation";
  status?: ListingLifecycleStatus;
};

function asNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function asPositiveNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return undefined;
  return value;
}

function asNonNegativeNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return undefined;
  return value;
}

function asIsoDate(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

function normalizeManagedListing(value: unknown): ManagedListing | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id = asNonEmptyString(record.id);
  const title = asNonEmptyString(record.title);
  const description = asNonEmptyString(record.description);
  const restaurantId = asNonEmptyString(record.restaurantId);
  const restaurantName = asNonEmptyString(record.restaurantName);
  const pickupWindowStart = asIsoDate(record.pickupWindowStart);
  const pickupWindowEnd = asIsoDate(record.pickupWindowEnd);
  const distanceMiles = asPositiveNumber(record.distanceMiles) ?? 0.1;
  const priceCents = asNonNegativeNumber(record.priceCents) ?? 0;
  const quantityRemaining = asNonNegativeNumber(record.quantityRemaining) ?? 0;
  if (
    !id ||
    !title ||
    !description ||
    !restaurantId ||
    !restaurantName ||
    !pickupWindowStart ||
    !pickupWindowEnd
  ) {
    return null;
  }

  const quantityTotal = asPositiveNumber(record.quantityTotal) ?? quantityRemaining;
  const fallbackCutoff = new Date(new Date(pickupWindowStart).getTime() - 30 * 60 * 1000).toISOString();
  const reservationCutoffAt = asIsoDate(record.reservationCutoffAt) ?? fallbackCutoff;
  const updatedAt = asIsoDate(record.updatedAt) ?? new Date().toISOString();
  const createdAt = asIsoDate(record.createdAt) ?? updatedAt;
  const dietary = Array.isArray(record.dietary)
    ? record.dietary.filter(
        (item): item is ListingItem["dietary"][number] =>
          item === "vegan" ||
          item === "vegetarian" ||
          item === "gluten_free" ||
          item === "dairy_free",
      )
    : [];
  const status: ListingLifecycleStatus =
    record.status === "paused" || record.status === "archived" || record.status === "active"
      ? record.status
      : "active";

  return {
    id,
    title,
    description,
    restaurantId,
    restaurantName,
    distanceMiles,
    pickupWindowStart,
    pickupWindowEnd,
    dietary,
    priceCents: Math.round(priceCents),
    quantityRemaining: Math.round(quantityRemaining),
    quantityTotal: Math.round(quantityTotal),
    reservationCutoffAt,
    donationFallbackEnabled: record.donationFallbackEnabled !== false,
    photoFileName: asNonEmptyString(record.photoFileName),
    listingType: record.listingType === "donation" ? "donation" : "consumer",
    status,
    createdAt,
    updatedAt,
    allergyNotes: asNonEmptyString(record.allergyNotes),
  };
}

async function persistCreatedListing(created: ManagedListing) {
  const persisted = await readPersistedListings();
  const next = [created, ...persisted];
  await writePersistedListings(next);
}

export async function saveListing(input: {
  values: ListingInput;
  restaurantId: string;
  restaurantName: string;
  distanceMiles: number;
}): Promise<ManagedListing> {
  return runExclusive(async () => {
    const created = buildListing(input);
    await persistCreatedListing(created);
    return created;
  });
}

export async function listManagedListings(scope: ListingScope = {}): Promise<ManagedListing[]> {
  const persisted = await readPersistedListings();
  const filtered = scope.restaurantId
    ? persisted.filter((listing) => listing.restaurantId === scope.restaurantId)
    : persisted;

  return filtered.sort((a, b) => {
    const aTime = new Date(a.updatedAt).getTime();
    const bTime = new Date(b.updatedAt).getTime();
    return bTime - aTime;
  });
}

export async function getManagedListingById(
  listingId: string,
  scope: ListingScope = {},
): Promise<ManagedListing | null> {
  const listings = await listManagedListings(scope);
  return listings.find((listing) => listing.id === listingId) ?? null;
}

export async function updateManagedListing(
  listingId: string,
  changes: ListingManagementChanges,
  scope: ListingScope = {},
): Promise<ManagedListing | null> {
  return runExclusive(async () => {
    const persisted = await readPersistedListings();
    const index = persisted.findIndex((entry) => entry.id === listingId);
    if (index < 0) return null;
    const existing = persisted[index];
    if (scope.restaurantId && existing.restaurantId !== scope.restaurantId) return null;

    const nextStatus = changes.status ?? existing.status;
    const nextQuantityTotal = Math.max(
      1,
      Math.round(changes.quantityTotal ?? existing.quantityTotal),
    );
    const nextQuantityRemaining = Math.max(
      0,
      Math.min(
        nextQuantityTotal,
        Math.round(changes.quantityRemaining ?? existing.quantityRemaining),
      ),
    );

    const updated: ManagedListing = {
      ...existing,
      title: changes.title?.trim() || existing.title,
      description: changes.description?.trim() || existing.description,
      allergyNotes: changes.allergyNotes?.trim() || existing.allergyNotes,
      priceCents: changes.priceCents ?? existing.priceCents,
      quantityTotal: nextQuantityTotal,
      quantityRemaining: nextQuantityRemaining,
      pickupWindowStart: changes.pickupWindowStart ?? existing.pickupWindowStart,
      pickupWindowEnd: changes.pickupWindowEnd ?? existing.pickupWindowEnd,
      reservationCutoffAt: changes.reservationCutoffAt ?? existing.reservationCutoffAt,
      photoFileName: changes.photoFileName?.trim() || existing.photoFileName,
      donationFallbackEnabled:
        changes.donationFallbackEnabled ?? existing.donationFallbackEnabled,
      listingType: changes.listingType ?? existing.listingType,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    };

    persisted[index] = updated;
    await writePersistedListings(persisted);
    return updated;
  });
}

export async function deleteManagedListing(
  listingId: string,
  scope: ListingScope = {},
): Promise<boolean> {
  return runExclusive(async () => {
    const persisted = await readPersistedListings();
    const next = persisted.filter((entry) => {
      if (entry.id !== listingId) return true;
      if (scope.restaurantId && entry.restaurantId !== scope.restaurantId) return true;
      return false;
    });
    if (next.length === persisted.length) return false;
    await writePersistedListings(next);
    return true;
  });
}

async function writePersistedListings(next: ManagedListing[]) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(LISTINGS_FILE, JSON.stringify(next, null, 2), "utf8");
}

