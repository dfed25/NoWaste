import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRestaurantById, listings } from "@/lib/marketplace";

type RestaurantDetailPageProps = {
  params: Promise<{ restaurantId: string }>;
};

export default async function RestaurantDetailPage({ params }: RestaurantDetailPageProps) {
  const { restaurantId } = await params;
  const restaurant = getRestaurantById(restaurantId);
  if (!restaurant) notFound();

  const restaurantListings = listings.filter((item) => item.restaurantId === restaurant.id);

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-title-lg">{restaurant.name}</h1>
        <p className="text-body-sm text-neutral-600">{restaurant.address}</p>
      </div>

      <Card className="space-y-2">
        <p className="text-sm text-neutral-700">{restaurant.description}</p>
        <div className="flex flex-wrap gap-1.5">
          {restaurant.tags.map((tag) => (
            <Badge key={tag} variant="brand">
              {tag}
            </Badge>
          ))}
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-title-md">Current listings</h2>
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
                className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-neutral-500">${(item.priceCents / 100).toFixed(2)}</p>
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

