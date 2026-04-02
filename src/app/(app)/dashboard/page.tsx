import { Card } from "@/components/ui/card";
import { StatusIndicator } from "@/components/ui/status-indicator";

export default function DashboardPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-title-lg">Dashboard</h1>
        <p className="text-body-sm text-neutral-600">
          Mobile-first operational overview for the marketplace.
        </p>
      </div>
      <Card variant="elevated" className="space-y-3">
        <h2 className="text-title-md">Quick status</h2>
        <div className="flex flex-wrap gap-2">
          <StatusIndicator status="active" />
          <StatusIndicator status="reserved" />
          <StatusIndicator status="donation_eligible" />
        </div>
      </Card>
    </section>
  );
}

