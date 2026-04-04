import Link from "next/link";
import { Card } from "@/components/ui/card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import type { TonightListingRow } from "@/lib/restaurant-dashboard-metrics";

type Props = {
  /** When empty, optional CTA can be hidden (e.g. read-only embeds). */
  listings: TonightListingRow[];
  showCreateListingLink?: boolean;
};

export function TonightsListingsPanel({
  listings,
  showCreateListingLink = true,
}: Props) {
  return (
    <Card variant="elevated" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-title-md">Tonight&apos;s listings</h2>
        {showCreateListingLink ? (
          <Link
            href="/listings/new"
            className="inline-flex h-9 items-center justify-center rounded-xl bg-brand-600 px-3 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            Create listing
          </Link>
        ) : null}
      </div>
      {listings.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No active listings with pickup windows today. Create one to appear here.
        </p>
      ) : (
        <div className="space-y-2">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-neutral-900">{listing.title}</p>
                <p className="text-xs text-neutral-500">Qty remaining: {listing.qty}</p>
              </div>
              <StatusIndicator status={listing.status} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
