import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";

export default function ListingsPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-title-lg">Listings</h1>
        <p className="text-body-sm text-neutral-600">
          Shared listing surface for consumer and donation flows.
        </p>
      </div>
      <EmptyState
        title="No listings yet"
        description="Create your first listing to start accepting reservations."
        action={<Button size="sm">Create listing</Button>}
      />
    </section>
  );
}

