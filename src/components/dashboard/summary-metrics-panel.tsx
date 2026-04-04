import { Card } from "@/components/ui/card";
import type { RestaurantDashboardMetrics } from "@/lib/restaurant-dashboard-metrics";

type Props = {
  metrics: RestaurantDashboardMetrics | null;
};

function cell(label: string, value: string) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="text-lg font-semibold text-neutral-900">{value}</p>
    </div>
  );
}

export function SummaryMetricsPanel({ metrics }: Props) {
  if (!metrics) {
    return (
      <Card variant="elevated" className="space-y-3">
        <h2 className="text-title-md">Summary metrics</h2>
        <p className="text-sm text-neutral-600">
          Scoped metrics appear when you are signed in as restaurant staff for a specific location.
        </p>
      </Card>
    );
  }

  return (
    <Card variant="elevated" className="space-y-3">
      <h2 className="text-title-md">Summary metrics</h2>
      <div className="grid grid-cols-2 gap-3">
        {cell("Active listings", String(metrics.activeListings))}
        {cell("Active reservations", String(metrics.activeReservations))}
        {cell("Items remaining", String(metrics.itemsRemaining))}
        {cell("Donation eligible (near close)", String(metrics.donationEligible))}
      </div>
    </Card>
  );
}
