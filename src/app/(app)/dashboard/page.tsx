import { RestaurantDashboardShell } from "@/components/dashboard/restaurant-dashboard-shell";

export default function DashboardPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-title-lg">Restaurant dashboard</h1>
        <p className="text-body-sm text-neutral-600">
          Overview of tonight&apos;s listings, activity, and summary metrics.
        </p>
      </div>
      <RestaurantDashboardShell />
    </section>
  );
}

