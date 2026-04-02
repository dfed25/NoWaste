import { NotificationPreferencesForm } from "@/components/notifications/notification-preferences-form";

export default function NotificationSettingsPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-title-lg">Notification settings</h1>
        <p className="text-body-sm text-neutral-600">
          Configure channels and event-driven notification triggers.
        </p>
      </div>
      <NotificationPreferencesForm />
    </section>
  );
}

