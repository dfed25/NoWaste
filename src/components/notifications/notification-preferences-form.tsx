"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/feedback/toast-provider";
import {
  createDefaultNotificationPreferences,
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

type PreferencesPayload = {
  preference?: {
    email: boolean;
    sms: boolean;
    events: NotificationEvent[];
  };
  error?: string;
};

export function NotificationPreferencesForm() {
  const defaults = createDefaultNotificationPreferences();
  const { pushToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [email, setEmail] = useState(defaults.email);
  const [sms, setSms] = useState(defaults.sms);
  const [events, setEvents] = useState(defaults.events);
  const [lastSent, setLastSent] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadPreferences() {
      try {
        const response = await fetch("/api/account/notifications/preferences", {
          cache: "no-store",
        });
        const payload = (await response.json()) as PreferencesPayload;

        if (!response.ok) {
          throw new Error(payload.error ?? "Could not load notification settings");
        }

        if (!mounted || !payload.preference) return;

        setEmail(payload.preference.email);
        setSms(payload.preference.sms);
        setEvents(payload.preference.events);
      } catch (error) {
        if (!mounted) return;
        pushToast({
          tone: "error",
          title: "Unable to load notification settings",
          description:
            error instanceof Error ? error.message : "Please refresh and try again.",
        });
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void loadPreferences();
    return () => {
      mounted = false;
    };
  }, [pushToast]);

  function toggleEvent(event: NotificationEvent) {
    setEvents((prev) =>
      prev.includes(event)
        ? prev.filter((value) => value !== event)
        : [...prev, event],
    );
  }

  async function savePreferences() {
    setIsSaving(true);
    try {
      const response = await fetch("/api/account/notifications/preferences", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email,
          sms,
          events,
        }),
      });

      const payload = (await response.json()) as PreferencesPayload;
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not save notification settings");
      }

      pushToast({
        tone: "success",
        title: "Preferences saved",
        description: "Your notification settings are now persisted.",
      });
    } catch (error) {
      pushToast({
        tone: "error",
        title: "Save failed",
        description:
          error instanceof Error
            ? error.message
            : "Unable to save notification settings.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function sendTest(event: NotificationEvent) {
    setSendError(null);
    setIsSending(true);
    try {
      await dispatchEventNotification({
        event,
        toEmail: "test@nowaste.app",
        toPhone: "+15555551212",
        preference: { email, sms, events },
      });
      setLastSent(eventLabels[event]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to send test notification";
      setSendError(message);
    } finally {
      setIsSending(false);
    }
  }

  if (isLoading) {
    return (
      <Card className="space-y-2">
        <p className="text-sm text-neutral-600">Loading notification settings...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-title-md">Delivery channels</h2>
          <Button
            type="button"
            size="sm"
            onClick={savePreferences}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save preferences"}
          </Button>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-neutral-700">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={email}
              onChange={(event) => setEmail(event.target.checked)}
            />
            Email service enabled
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={sms}
              onChange={(event) => setSms(event.target.checked)}
            />
            SMS placeholder enabled
          </label>
          <Badge variant="neutral">{events.length} triggers active</Badge>
        </div>
      </Card>

      <Card className="space-y-3">
        <h3 className="text-sm font-semibold text-neutral-900">
          Event-driven triggers
        </h3>
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
                disabled={isSending}
              >
                {isSending ? "Sending..." : "Send test"}
              </Button>
            </div>
          ))}
        </div>
        {sendError ? <p className="text-xs text-red-600">{sendError}</p> : null}
        {lastSent ? (
          <p className="text-xs text-neutral-500">Last test sent: {lastSent}</p>
        ) : null}
      </Card>
    </div>
  );
}
