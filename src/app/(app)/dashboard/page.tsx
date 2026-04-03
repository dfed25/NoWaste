import { RestaurantDashboardShell } from "@/components/dashboard/restaurant-dashboard-shell";
import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-title-lg">Restaurant dashboard</h1>
        <p className="text-body-sm text-neutral-600">
          Overview of tonight&apos;s listings, activity, and summary metrics.
        </p>
      </div>

      <Card className="space-y-2 border-brand-100 bg-gradient-to-r from-brand-50 to-white">
        <h2 className="text-title-md">New: Listings operations hub</h2>
        <p className="text-sm text-neutral-600">
          Quickly pause, archive, edit inventory, and publish new listings from one screen.
        </p>
        <Link href="/listings" className="inline-flex text-sm font-medium text-brand-700 hover:underline">
          Open listings hub
        </Link>
      </Card>

      <RestaurantDashboardShell />
      <div className="flex flex-wrap gap-3 text-sm">
        <Link className="text-brand-700 hover:underline" href="/pickups/verify">
          Pickup verification
        </Link>
        <Link className="text-brand-700 hover:underline" href="/donation/workflow">
          Donation workflow
        </Link>
        <Link className="text-brand-700 hover:underline" href="/admin">
          Admin panel
        </Link>
      </div>
    </section>
  );
}

