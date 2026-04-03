export const SAVED_LISTINGS_KEY = "nw-saved-listings";
export const SAVED_LISTINGS_CHANGED_EVENT = "saved-listings-changed";

export function readSavedListingIdsFromStorage(storage: Storage): string[] {
  try {
    const raw = storage.getItem(SAVED_LISTINGS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === "string");
  } catch {
    return [];
  }
}

export function writeSavedListingIdsToStorage(storage: Storage, ids: string[]): void {
  try {
    storage.setItem(SAVED_LISTINGS_KEY, JSON.stringify(ids));
  } catch {
    // Best-effort persistence only.
  }
}

export function notifySavedListingsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SAVED_LISTINGS_CHANGED_EVENT));
}
