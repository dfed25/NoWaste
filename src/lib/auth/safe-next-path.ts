/**
 * Shared helpers for post-login `next` handling and restaurant onboarding entry URLs.
 * Used by server pages and client login so redirects stay consistent.
 */

/** Relative app path for restaurant staff onboarding (path segment only; no query). */
export const RESTAURANT_ONBOARDING_PATH = "/onboarding/restaurant";

/** Login URL that returns the user to restaurant onboarding after sign-in. */
export const RESTAURANT_ONBOARDING_LOGIN_HREF =
  `/auth/login?next=${encodeURIComponent(RESTAURANT_ONBOARDING_PATH)}&role=restaurant`;

function isSafeInternalPath(value: string): boolean {
  return (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("://") &&
    !value.startsWith("/\\")
  );
}

/**
 * Returns a safe relative path for redirects, or null if the value must be ignored
 * (same rules as the login form after submit).
 */
export function sanitizeAuthNextParam(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return isSafeInternalPath(trimmed) ? trimmed : null;
}

export function pickFirstSearchParam(
  value: string | string[] | null | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value ?? undefined;
}

/** Whether the sanitized `next` value will send the user to restaurant onboarding. */
export function isReturnToRestaurantOnboarding(sanitizedNext: string | null): boolean {
  if (!sanitizedNext) return false;
  const pathOnly = sanitizedNext.split("?")[0] ?? "";
  return pathOnly === RESTAURANT_ONBOARDING_PATH;
}
