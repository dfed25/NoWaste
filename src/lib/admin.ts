export const ADMIN_ROLE_COOKIE = "nw-role";

export type AppRole = "customer" | "restaurant_staff" | "admin";

export function hasAdminAccess(isAuthenticated: boolean, role?: string) {
  return isAuthenticated && role === "admin";
}

export function normalizeRole(value: string | null | undefined): AppRole | undefined {
  if (!value) return undefined;
  if (value === "customer") return "customer";
  if (value === "restaurant" || value === "restaurant_staff") return "restaurant_staff";
  if (value === "admin") return "admin";
  return undefined;
}

export function routeForRole(role?: string) {
  if (role === "admin") return "/admin";
  if (role === "restaurant_staff") return "/dashboard";
  return "/";
}

export function serializeRoleCookie(role: AppRole, isSecure: boolean) {
  const safeRole = encodeURIComponent(role);
  return `${ADMIN_ROLE_COOKIE}=${safeRole}; Path=/; Max-Age=604800; SameSite=Lax${
    isSecure ? "; Secure" : ""
  }`;
}
