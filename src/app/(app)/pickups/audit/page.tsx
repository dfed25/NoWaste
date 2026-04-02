import { Card } from "@/components/ui/card";
import { getPickupAuditEvents } from "@/lib/pickup-audit-store";

export default async function PickupAuditPage() {
  let auditEvents: Awaited<ReturnType<typeof getPickupAuditEvents>> = [];
  let loadError: string | null = null;
  try {
    auditEvents = await getPickupAuditEvents();
  } catch {
    loadError = "Unable to load pickup audit events right now.";
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-title-lg">Pickup audit events</h1>
        <p className="text-body-sm text-neutral-600">
          Immutable record of verification and fulfillment events.
        </p>
      </div>
      <Card>
        {loadError ? <p className="text-sm text-red-600">{loadError}</p> : null}
        {!loadError && auditEvents.length === 0 ? (
          <p className="text-sm text-neutral-600">No pickup audit events yet.</p>
        ) : null}
        {!loadError && auditEvents.length > 0 ? (
          <ul className="space-y-2">
            {auditEvents.map((event) => (
              <li key={event.id} className="text-sm text-neutral-700">
                {event.orderId} - {event.type.replaceAll("_", " ")} - {event.actor}
              </li>
            ))}
          </ul>
        ) : null}
      </Card>
    </section>
  );
}

