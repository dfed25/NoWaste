import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { MarketplaceFeed } from "@/components/marketplace/marketplace-feed";

export default function Home() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-title-xl">Frontend foundation is ready</h1>
        <p className="text-body-md text-neutral-600">
          Route groups, UI primitives, validation helpers, and mobile navigation
          are scaffolded for EPIC 6.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="brand">APP-95 to APP-111</Badge>
        <StatusIndicator status="active" />
      </div>

      <Card variant="elevated" className="space-y-3">
        <h2 className="text-title-md">UI primitives</h2>
        <div className="flex flex-wrap gap-2">
          <Button size="sm">Primary</Button>
          <Button size="sm" variant="secondary">
            Secondary
          </Button>
          <Button size="sm" variant="ghost">
            Ghost
          </Button>
          <Button size="sm" variant="danger">
            Danger
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Guest email" placeholder="guest@example.com" />
          <Textarea
            label="Listing description"
            placeholder="Describe what is included"
          />
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <EmptyState
          title="No orders yet"
          description="Orders will appear here once checkout is wired up."
          action={
            <Link
              href="/listings/new"
              className="inline-flex h-9 items-center justify-center rounded-xl bg-brand-600 px-3 text-sm font-medium text-white transition-colors hover:bg-brand-700"
            >
              Create first listing
            </Link>
          }
        />
        <ErrorState message="Failed to load listings. Retry once API routes are connected." />
      </div>

      <Card className="space-y-2">
        <h2 className="text-title-md">Route groups</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700">
          <li>
            <Link href="/dashboard" className="text-brand-700 hover:underline">
              /dashboard
            </Link>
          </li>
          <li>
            <Link href="/listings" className="text-brand-700 hover:underline">
              /listings
            </Link>
          </li>
          <li>
            <Link href="/orders" className="text-brand-700 hover:underline">
              /orders
            </Link>
          </li>
          <li>
            <Link href="/about" className="text-brand-700 hover:underline">
              /about
            </Link>
          </li>
        </ul>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-title-md">Customer marketplace</h2>
        <p className="text-body-sm text-neutral-600">
          EPIC 9 browse feed with search and filters.
        </p>
        <MarketplaceFeed />
      </Card>
    </section>
  );
}
