"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  defaultNotificationPreferences,
  dispatchEventNotification,
  type NotificationEvent,
} from "@/lib/notifications";

const eventLabels: Record<NotificationEvent, string> = {
  reservation_confirmed: "Reservation confirmation email",
  pickup_reminder: "Pickup reminder email",
  reservation_canceled: "Reservation canceled email",
  listing_sold_out: "Listing sold out notification",
  new_reservation: "New reservation notification",
  pickup_completed: "Pickup completed notification",
  donation_fallback_triggered: "Donation fallback triggered notification",
  donation_available: "Donation available notification",
  donation_claimed: "Donation claimed confirmation",
  donation_pickup_reminder: "Donation pickup reminder",
};

export function NotificationPreferencesForm() {
  const [email, setEmail] = useState(defaultNotificationPreferences.email);
  const [sms, setSms] = useState(defaultNotificationPreferences.sms);
  const [events, setEvents] = useState(defaultNotificationPreferences.events);
  const [lastSent, setLastSent] = useState<string | null>(null);

  const enabledCount = useMemo(() => events.length, [events]);

  function toggleEvent(event: NotificationEvent) {
    setEvents((prev) => (prev.includes(event) ? prev.filter((value) => value !== event) : [...prev, event]));
  }

  async function sendTest(event: NotificationEvent) {
    await dispatchEventNotification({
      event,
      toEmail: "test@nowaste.app",
      toPhone: "+15555551212",
      preference: { userId: "me", email, sms, events },
    });
    setLastSent(eventLabels[event]);
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <h2 className="text-title-md">Delivery channels</h2>
        <div className="flex flex-wrap gap-4 text-sm text-neutral-700">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={email} onChange={(event) => setEmail(event.target.checked)} />
            Email service enabled
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={sms} onChange={(event) => setSms(event.target.checked)} />
            SMS placeholder enabled
          </label>
          <Badge variant="neutral">{enabledCount} triggers active</Badge>
        </div>
      </Card>

      <Card className="space-y-3">
        <h3 className="text-sm font-semibold text-neutral-900">Event-driven triggers</h3>
        <div className="grid gap-2 md:grid-cols-2">
          {(Object.keys(eventLabels) as NotificationEvent[]).map((event) => (
            <div key={event} className="rounded-xl border border-neutral-200 p-3">
              <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={events.includes(event)}
                  onChange={() => toggleEvent(event)}
                />
                {eventLabels[event]}
              </label>
              <Button
                className="mt-2"
                size="sm"
                variant="secondary"
                onClick={() => sendTest(event)}
              >
                Send test
              </Button>
            </div>
          ))}
        </div>
        {lastSent ? <p className="text-xs text-neutral-500">Last test sent: {lastSent}</p> : null}
      </Card>
    </div>
  );
}

