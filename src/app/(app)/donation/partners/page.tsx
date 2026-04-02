import { Card } from "@/components/ui/card";
import { donationPartners } from "@/lib/donation";

export default function DonationPartnersPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-title-lg">Donation partner profiles</h1>
        <p className="text-body-sm text-neutral-600">
          Service radius, availability windows, and notification rules.
        </p>
      </div>
      <div className="space-y-3">
        {donationPartners.map((partner) => (
          <Card key={partner.id} className="space-y-1">
            <p className="text-sm font-semibold text-neutral-900">{partner.name}</p>
            <p className="text-xs text-neutral-600">
              Radius: {partner.serviceRadiusMiles} miles
            </p>
            <p className="text-xs text-neutral-600">
              Hours: {partner.hours.startHour}:00 - {partner.hours.endHour}:00
            </p>
            <p className="text-xs text-neutral-600">
              Alerts: email {partner.acceptsNotifications.email ? "on" : "off"}, sms{" "}
              {partner.acceptsNotifications.sms ? "on" : "off"}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}

