import Link from "next/link";
import { Card } from "@/components/ui/card";

const links = [
  { href: "/admin/restaurants", label: "Restaurants table" },
  { href: "/admin/listings", label: "Listings table" },
  { href: "/admin/orders", label: "Orders table" },
  { href: "/admin/donations", label: "Donations table" },
  { href: "/admin/users", label: "User management" },
  { href: "/admin/reports", label: "Reporting dashboard" },
];

export default function AdminPanelPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-title-lg">Admin panel</h1>
        <p className="text-body-sm text-neutral-600">Admin-only operations and reporting.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {links.map((link) => (
          <Card key={link.href}>
            <Link className="text-sm font-medium text-brand-700 hover:underline" href={link.href}>
              {link.label}
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
}

