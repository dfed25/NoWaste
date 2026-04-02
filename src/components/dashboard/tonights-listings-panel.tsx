import Link from "next/link";
import { Card } from "@/components/ui/card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Button } from "@/components/ui/button";

const tonightListings = [
  { id: "L-1001", title: "Bakery surprise bags", qty: 8, status: "active" as const },
  { id: "L-1002", title: "Prepared bowls", qty: 5, status: "reserved" as const },
  { id: "L-1003", title: "Salad mix boxes", qty: 3, status: "donation_eligible" as const },
];

export function TonightsListingsPanel() {
  return (
    <Card variant="elevated" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-title-md">Tonight&apos;s listings</h2>
        <Link href="/listings/new">
          <Button size="sm">Create listing</Button>
        </Link>
      </div>
      <div className="space-y-2">
        {tonightListings.map((listing) => (
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
    </Card>
  );
}

