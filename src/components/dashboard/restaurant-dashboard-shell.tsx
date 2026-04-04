import { SessionStatusCard } from "@/components/auth/session-status-card";
import { SummaryMetricsPanel } from "@/components/dashboard/summary-metrics-panel";
import { TonightsListingsPanel } from "@/components/dashboard/tonights-listings-panel";
import { RecentActivityPanel } from "@/components/dashboard/recent-activity-panel";
import type {
  DashboardActivityItem,
  RestaurantDashboardMetrics,
  TonightListingRow,
} from "@/lib/restaurant-dashboard-metrics";

type Props = {
  metrics: RestaurantDashboardMetrics | null;
  activity: DashboardActivityItem[];
  tonightListings: TonightListingRow[] | null;
};

export function RestaurantDashboardShell({ metrics, activity, tonightListings }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SummaryMetricsPanel metrics={metrics} />
      <SessionStatusCard />
      <div className="md:col-span-2">
        <TonightsListingsPanel listings={tonightListings} />
      </div>
      <div className="md:col-span-2">
        <RecentActivityPanel activity={activity} />
      </div>
    </div>
  );
}
