import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRestaurantById } from "@/lib/marketplace";
import { listAllListings } from "@/lib/marketplace-store";

type RestaurantDetailPageProps = {
  params: Promise<{ restaurantId: string }>;
};

export default async function RestaurantDetailPage({ params }: RestaurantDetailPageProps) {
  const { restaurantId } = await params;
  const restaurant = getRestaurantById(restaurantId);
  if (!restaurant) notFound();

  const allListings = await listAllListings();
  const restaurantListings = allListings.filter((item) => item.restaurantId === restaurant.id);

  return (
    <section className="space-y-5">
      <Card variant="elevated" className="space-y-4 border-neutral-200/80 bg-gradient-to-br from-white to-neutral-100/60">
        <div className="space-y-2">
          <h1 className="text-title-lg text-neutral-900">{restaurant.name}</h1>
          <p className="text-body-sm text-neutral-600">{restaurant.address}</p>
          <p className="text-sm text-neutral-700">{restaurant.description}</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {restaurant.tags.map((tag) => (
            <Badge key={tag} variant="brand">
              {tag}
            </Badge>
          ))}
        </div>
      </Card>

      <Card className="space-y-3 border-neutral-200/80">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-title-md">Current listings</h2>
          <Badge variant="neutral">{restaurantListings.length} active</Badge>
        </div>

        {restaurantListings.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 px-4 py-6 text-center">
            <p className="text-sm font-medium text-neutral-800">No listings yet</p>
            <p className="mt-1 text-xs text-neutral-500">
              New surplus listings will appear here once published.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {restaurantListings.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-neutral-900">{item.title}</p>
                  <p className="text-xs text-neutral-500">
                    ${(item.priceCents / 100).toFixed(2)} · {item.quantityRemaining} left
                  </p>
                </div>
                <Link
                  href={`/listings/${item.id}`}
                  className="inline-flex h-9 items-center justify-center rounded-xl bg-brand-600 px-3 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}
