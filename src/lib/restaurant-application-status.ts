export const RESTAURANT_APPLICATION_STATUSES = [
  "pending_verification",
  "pending_approval",
  "approved",
  "rejected",
  "suspended",
] as const;

export type RestaurantApplicationStatus = (typeof RESTAURANT_APPLICATION_STATUSES)[number];

export function isRestaurantApplicationStatus(value: string): value is RestaurantApplicationStatus {
  return (RESTAURANT_APPLICATION_STATUSES as readonly string[]).includes(value);
}

/**
 * Supabase metadata may omit this key for accounts created before onboarding gates existed;
 * those users are treated as approved so local/dev fixtures keep working.
 */
export function normalizeRestaurantApplicationStatus(value: unknown): RestaurantApplicationStatus {
  if (typeof value === "string" && isRestaurantApplicationStatus(value.trim())) {
    return value.trim() as RestaurantApplicationStatus;
  }
  return "approved";
}

export function canStaffOperateMarketplace(status: RestaurantApplicationStatus | undefined): boolean {
  return status === "approved";
}
