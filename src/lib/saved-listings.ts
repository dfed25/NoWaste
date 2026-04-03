export const SAVED_LISTINGS_KEY = "nw-saved-listings";

export function readSavedListingIdsFromStorage(storage: Storage): string[] {
  const raw = storage.getItem(SAVED_LISTINGS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === "string");
  } catch {
    return [];
  }
}

export function writeSavedListingIdsToStorage(storage: Storage, ids: string[]) {
  storage.setItem(SAVED_LISTINGS_KEY, JSON.stringify(ids));
}
