import { cookies } from "next/headers";
import { HomeAuthenticated } from "@/components/home/home-authenticated";
import { HomeMarketingLanding } from "@/components/home/home-marketing-landing";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookies";
import { listAllListings } from "@/lib/marketplace-store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get(AUTH_COOKIE_NAME)?.value === "1";

  if (!isAuthenticated) {
    return <HomeMarketingLanding />;
  }

  const listings = await listAllListings();
  return <HomeAuthenticated listings={listings} />;
}
