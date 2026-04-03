import Link from "next/link";
import { NotificationsCenter } from "@/components/notifications/notifications-center";
import { Card } from "@/components/ui/card";

export default function NotificationsPage() {
  return (
    <section className="space-y-5">
      <Card className="space-y-3 border-neutral-200/80 bg-gradient-to-br from-white via-white to-brand-100/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-title-lg">Notifications</h1>
            <p className="text-body-sm text-neutral-600">
              Track reservation updates, payment events, reminders, and system alerts in one place.
            </p>
          </div>
          <Link
            href="/account/notifications"
            className="inline-flex h-9 items-center justify-center rounded-xl bg-neutral-100 px-3 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-200"
          >
            Manage preferences
          </Link>
        </div>
      </Card>

      <NotificationsCenter />
    </section>
  );
}
