import { NotificationsCenter } from "@/components/notifications/notifications-center";

export default function NotificationsPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-title-lg">Notifications</h1>
        <p className="text-body-sm text-neutral-600">
          Track reservation updates, payment events, and pickup reminders.
        </p>
      </div>
      <NotificationsCenter />
    </section>
  );
}
