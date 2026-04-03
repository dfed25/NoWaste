const STORAGE_KEY = "nw_checkout_profile";

export type SavedCheckoutProfile = {
  name: string;
  email: string;
  phone: string;
};

export function readCheckoutProfile(): Partial<SavedCheckoutProfile> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const o = parsed as Record<string, unknown>;
    return {
      name: typeof o.name === "string" ? o.name : "",
      email: typeof o.email === "string" ? o.email : "",
      phone: typeof o.phone === "string" ? o.phone : "",
    };
  } catch {
    return null;
  }
}

export function writeCheckoutProfile(profile: SavedCheckoutProfile) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        name: profile.name.trim(),
        email: profile.email.trim(),
        phone: profile.phone.trim(),
      }),
    );
  } catch {
    /* quota / private mode */
  }
}
