import { SessionStatusCard } from "@/components/auth/session-status-card";
import { SummaryMetricsPanel } from "@/components/dashboard/summary-metrics-panel";
import { TonightsListingsPanel } from "@/components/dashboard/tonights-listings-panel";
import { RecentActivityPanel } from "@/components/dashboard/recent-activity-panel";

export function RestaurantDashboardShell() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SummaryMetricsPanel />
      <SessionStatusCard />
      <div className="md:col-span-2">
        <TonightsListingsPanel />
      </div>
      <div className="md:col-span-2">
        <RecentActivityPanel />
      </div>
    </div>
  );
}

