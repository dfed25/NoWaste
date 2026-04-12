import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { RestaurantDashboardShell } from "@/components/dashboard/restaurant-dashboard-shell";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { verifyServerSession } from "@/lib/server-session";
import { getRestaurantDashboardData } from "@/lib/restaurant-dashboard-metrics";

export default async function DashboardPage() {
  const headerList = await headers();
  const cookie = headerList.get("cookie") ?? "";
  const session = verifyServerSession(new Request("http://localhost", { headers: { cookie } }));

  if (session.user?.role === "customer") {
    redirect("/");
  }
  if (session.user?.role === "admin") {
    redirect("/admin");
  }
  if (session.user?.role !== "restaurant_staff") {
    redirect("/");
  }
  const restaurantId = session.user.scopedRestaurantId;
  if (!restaurantId) {
    redirect("/onboarding/restaurant");
  }

  const data = await getRestaurantDashboardData(restaurantId);

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-title-lg">Restaurant dashboard</h1>
        <p className="text-body-sm text-neutral-600">
          Overview of tonight&apos;s listings, activity, and summary metrics.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-2 border-brand-100 bg-gradient-to-r from-brand-50 to-white">
          <h2 className="text-title-md">Listings hub</h2>
          <p className="text-sm text-neutral-600">
            Pause, archive, edit inventory, and publish new listings from one screen.
          </p>
          <Link href="/listings" className="inline-flex text-sm font-medium text-brand-700 hover:underline">
            Open listings hub
          </Link>
        </Card>
        <Card className="space-y-2 border-emerald-100 bg-gradient-to-r from-emerald-50 to-white">
          <h2 className="text-title-md">Live reservations</h2>
          <p className="text-sm text-neutral-600">
            See today&apos;s checkouts, confirm pickup codes, and close the loop when guests arrive.
          </p>
          <Link
            href="/reservations"
            className="inline-flex text-sm font-medium text-emerald-800 hover:underline"
          >
            Open reservations
          </Link>
        </Card>
      </div>

      <RestaurantDashboardShell
        metrics={data.metrics}
        activity={data.activity}
        tonightListings={data.tonightListings}
      />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link className="text-brand-700 hover:underline" href="/pickups/verify">
          Pickup verification
        </Link>
        <Link className="text-brand-700 hover:underline" href="/donation/workflow">
          Donation workflow
        </Link>
      </div>
    </section>
  );
}
