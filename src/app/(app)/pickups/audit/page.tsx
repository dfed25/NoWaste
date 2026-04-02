import { Card } from "@/components/ui/card";

const sampleAudit = [
  "ord_1001 - code verified - restaurant",
  "ord_1001 - picked up - restaurant",
  "ord_1002 - expired - system",
];

export default function PickupAuditPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-title-lg">Pickup audit events</h1>
        <p className="text-body-sm text-neutral-600">
          Immutable record of verification and fulfillment events.
        </p>
      </div>
      <Card className="space-y-2">
        {sampleAudit.map((event) => (
          <p key={event} className="text-sm text-neutral-700">
            {event}
          </p>
        ))}
      </Card>
    </section>
  );
}

