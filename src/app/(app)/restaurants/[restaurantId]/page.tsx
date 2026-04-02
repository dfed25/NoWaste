import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
              <Link href={`/listings/${item.id}`}>
                <Button size="sm">View</Button>
              </Link>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}

