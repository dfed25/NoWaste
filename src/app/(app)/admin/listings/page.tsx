import { Card } from "@/components/ui/card";
import { getAdminTables } from "@/lib/admin-reporting";
import { requireAdminPageAccess } from "@/lib/admin-guard";

export default async function AdminListingsPage() {
  await requireAdminPageAccess();

  const { listings } = getAdminTables();
  return (
    <section className="space-y-4">
      <h1 className="text-title-lg">Listings table</h1>
      <Card className="space-y-2">
        {listings.map((listing) => (
          <p key={listing.id} className="text-sm text-neutral-700">
            {listing.id} - {listing.title} - qty {listing.quantityRemaining}
          </p>
        ))}
      </Card>
    </section>
  );
}
