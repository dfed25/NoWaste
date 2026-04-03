import Link from "next/link";
import { Card } from "@/components/ui/card";
import { getReportingMetrics } from "@/lib/admin-reporting";
import { requireAdminPageAccess } from "@/lib/admin-guard";

export default async function AdminReportsPage() {
  await requireAdminPageAccess();

  const metrics = getReportingMetrics();

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-title-lg">Reporting dashboard</h1>
        <p className="text-body-sm text-neutral-600">
          Sold vs donated, waste prevented, revenue recovered, conversion, and activity.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <p className="text-xs text-neutral-500">Sold vs donated</p>
          <p className="text-sm text-neutral-800">
            {metrics.soldVsDonated.soldCount} sold / {metrics.soldVsDonated.donatedCount} donated
          </p>
        </Card>
        <Card>
          <p className="text-xs text-neutral-500">Waste prevented estimate</p>
          <p className="text-sm text-neutral-800">{metrics.wastePreventedLbs.toFixed(1)} lbs</p>
        </Card>
        <Card>
          <p className="text-xs text-neutral-500">Revenue recovered estimate</p>
          <p className="text-sm text-neutral-800">
            ${metrics.revenueRecoveredDollars.toFixed(2)}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-neutral-500">Listing conversion rate</p>
          <p className="text-sm text-neutral-800">{metrics.listingConversionRate.toFixed(1)}%</p>
        </Card>
      </div>
      <Card>
        <Link className="text-sm font-medium text-brand-700 hover:underline" href="/api/admin/reports/csv">
          Export CSV
        </Link>
      </Card>
    </section>
  );
}
