export const ADMIN_ROLE_COOKIE = "nw-role";

export function hasAdminAccess(isAuthenticated: boolean, role?: string) {
  return isAuthenticated && role === "admin";
}

