export const ADMIN_ROLE_COOKIE = "nw-role";

export type AppRole = "customer" | "restaurant_staff";

export function hasAdminAccess(isAuthenticated: boolean, role?: string) {
  return isAuthenticated && role === "admin";
}

export function normalizeRole(value: string | null | undefined): AppRole | undefined {
  if (!value) return undefined;
  if (value === "customer") return "customer";
  if (value === "restaurant" || value === "restaurant_staff") return "restaurant_staff";
  return undefined;
}

export function routeForRole(role?: string) {
  if (role === "restaurant_staff" || role === "admin") {
    return "/dashboard";
  }
  return "/";
}

export function serializeRoleCookie(role: string, isSecure: boolean) {
  return `${ADMIN_ROLE_COOKIE}=${role}; Path=/; Max-Age=604800; SameSite=Lax${
    isSecure ? "; Secure" : ""
  }`;
}
