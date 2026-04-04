import { Card } from "@/components/ui/card";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { listPickupAuditEventsForScope } from "@/lib/pickup-audit-store";
import { verifyServerSession } from "@/lib/server-session";

export default async function PickupAuditPage() {
  const headerList = await headers();
  const cookieHeader = headerList.get("cookie") ?? "";
  const session = verifyServerSession(
    new Request("http://localhost", { headers: { cookie: cookieHeader } }),
  );

  if (!session.isAuthenticated) {
    redirect("/auth/login?next=/pickups/audit");
  }
  if (session.user?.role === "customer") {
    redirect("/");
  }

  const isAdmin = session.user?.role === "admin";
  const restaurantId =
    session.user?.role === "restaurant_staff" ? (session.user.scopedRestaurantId ?? null) : null;

  if (!isAdmin && !restaurantId) {
    redirect("/dashboard");
  }

  let auditEvents: Awaited<ReturnType<typeof listPickupAuditEventsForScope>> = [];
  let loadError: string | null = null;
  try {
    auditEvents = await listPickupAuditEventsForScope({ restaurantId, isAdmin });
  } catch {
    loadError = "Unable to load pickup audit events right now.";
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-title-lg">Pickup audit events</h1>
        <p className="text-body-sm text-neutral-600">
          Immutable record of verification and fulfillment events for your restaurant (or all locations
          for admins).
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
                {event.orderId} — {event.type.replaceAll("_", " ")} — {event.actor}
                <span className="block text-xs text-neutral-500">
                  {new Date(event.at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </Card>
    </section>
  );
}
