import { Card } from "@/components/ui/card";
import { getAdminTables } from "@/lib/admin-reporting";

export default function AdminDonationsPage() {
  const { donations } = getAdminTables();
  return (
    <section className="space-y-4">
      <h1 className="text-title-lg">Donations table</h1>
      <Card className="space-y-2">
        {donations.map((donation) => (
          <p key={donation.id} className="text-sm text-neutral-700">
            {donation.id} - {donation.listingTitle} - {donation.status}
          </p>
        ))}
      </Card>
    </section>
  );
}

