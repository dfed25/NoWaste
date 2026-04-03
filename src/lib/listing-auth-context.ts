import { cookies } from "next/headers";
import { ADMIN_ROLE_COOKIE } from "@/lib/admin";
import { AUTH_COOKIE_NAME, RESTAURANT_ID_COOKIE_NAME } from "@/lib/auth-cookies";

export type ListingAuthContext = {
  isAuthenticated: boolean;
  role: string | undefined;
  scopedRestaurantId: string | undefined;
};

export async function resolveListingAuthContext(): Promise<ListingAuthContext> {
  const cookieStore = await cookies();
  return {
    isAuthenticated: cookieStore.get(AUTH_COOKIE_NAME)?.value === "1",
    role: cookieStore.get(ADMIN_ROLE_COOKIE)?.value,
    scopedRestaurantId: cookieStore.get(RESTAURANT_ID_COOKIE_NAME)?.value,
  };
}
