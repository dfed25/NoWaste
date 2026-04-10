import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { ADMIN_ROLE_COOKIE, normalizeRole, type AppRole } from "@/lib/admin";
import { AUTH_COOKIE_NAME, RESTAURANT_ID_COOKIE_NAME } from "@/lib/auth-cookies";

export const NW_SESSION_SIGNATURE_COOKIE_NAME = "nw-session-sig";

type VerifiedSession = {
  isAuthenticated: boolean;
  user?: {
    role?: string;
    /** Present for restaurant_staff when the signed session includes scope. */
    scopedRestaurantId?: string;
  };
};

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return "";
  }
}

function parseCookies(cookieHeader: string) {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((value) => value.trim())
      .filter(Boolean)
      .map((pair) => {
        const index = pair.indexOf("=");
        if (index < 0) return [pair, ""];
        const key = pair.slice(0, index);
        const rawValue = pair.slice(index + 1);
        return [key, safeDecode(rawValue)];
      }),
  );
}

function hasValidSignature(value: string, providedSignature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(value).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(providedSignature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Canonical string covered by `nw-session-sig` (restaurant segment empty unless staff). */
export function buildNwSessionCanonical(role: string, restaurantIdForStaff: string) {
  const segment = role === "restaurant_staff" ? restaurantIdForStaff : "";
  return `${AUTH_COOKIE_NAME}=1;${ADMIN_ROLE_COOKIE}=${role};${RESTAURANT_ID_COOKIE_NAME}=${segment}`;
}

export function signNwSessionCanonical(canonical: string, secret: string) {
  return createHmac("sha256", secret).update(canonical).digest("hex");
}

export function verifyServerSession(request: Request): VerifiedSession {
  const cookies = parseCookies(request.headers.get("cookie") ?? "");
  const isAuthenticated = cookies[AUTH_COOKIE_NAME] === "1";
  const role = cookies[ADMIN_ROLE_COOKIE];
  const signature = cookies[NW_SESSION_SIGNATURE_COOKIE_NAME];
  const secret = process.env.AUTH_SESSION_SECRET;

  if (!isAuthenticated || !role || !signature || !secret) {
    return { isAuthenticated: false };
  }

  const restaurantCookie = cookies[RESTAURANT_ID_COOKIE_NAME] ?? "";
  const effectiveRestaurant = role === "restaurant_staff" ? restaurantCookie : "";
  const canonicalNew = buildNwSessionCanonical(role, effectiveRestaurant);

  let isValid = hasValidSignature(canonicalNew, signature, secret);
  if (!isValid && role !== "restaurant_staff") {
    const legacy = `${AUTH_COOKIE_NAME}=1;${ADMIN_ROLE_COOKIE}=${role}`;
    isValid = hasValidSignature(legacy, signature, secret);
  }

  if (!isValid) return { isAuthenticated: false };

  return {
    isAuthenticated: true,
    user: {
      role,
      scopedRestaurantId: role === "restaurant_staff" ? effectiveRestaurant : undefined,
    },
  };
}

/**
 * When HMAC cookies are missing (before sync-session), still expose role from `nw-role`
 * for nav UI. APIs should prefer {@link verifyServerSession}.
 */
export function readNwRoleCookieFallback(request: Request): AppRole | null {
  const cookies = parseCookies(request.headers.get("cookie") ?? "");
  if (cookies[AUTH_COOKIE_NAME] !== "1") return null;
  return normalizeRole(cookies[ADMIN_ROLE_COOKIE]) ?? null;
}
