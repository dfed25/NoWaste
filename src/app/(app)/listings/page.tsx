import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_ROLE_COOKIE } from "@/lib/admin";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookies";
import { RestaurantListingsManager } from "@/components/listings/restaurant-listings-manager";
import { Card } from "@/components/ui/card";

export default async function ListingsPage() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get(AUTH_COOKIE_NAME)?.value === "1";
  const role = cookieStore.get(ADMIN_ROLE_COOKIE)?.value;
  if (!isAuthenticated) {
    redirect("/auth/login?next=/listings");
  }
  if (role !== "restaurant_staff" && role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-white to-brand-50 p-5">
        <h1 className="text-title-lg">Listings operations</h1>
        <p className="mt-1 text-body-sm text-neutral-600">
          Control live listing inventory, publish new offers quickly, and keep pickup windows accurate.
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link className="text-brand-700 hover:underline" href="/listings/new">
            Create a new listing
          </Link>
          <Link className="font-medium text-emerald-800 hover:underline" href="/reservations">
            Live reservations
          </Link>
          <Link className="text-brand-700 hover:underline" href="/dashboard">
            Back to dashboard
          </Link>
        </div>
      </div>

      <Card className="space-y-2 bg-white">
        <p className="text-sm text-neutral-600">
          This management hub updates persisted listings through authenticated APIs. Changes appear instantly for your
          operations team.
        </p>
      </Card>

      <RestaurantListingsManager />
    </section>
  );
}

