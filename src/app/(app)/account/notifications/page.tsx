import Link from "next/link";
import { NotificationPreferencesForm } from "@/components/notifications/notification-preferences-form";
import { NotificationsCenter } from "@/components/notifications/notifications-center";
import { Card } from "@/components/ui/card";

export default function NotificationSettingsPage() {
  return (
    <section className="space-y-5">
      <Card className="space-y-3 border-neutral-200/80 bg-gradient-to-br from-white via-white to-brand-100/20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-title-lg">Notification settings</h1>
            <p className="text-body-sm text-neutral-600">
              Configure channels, event triggers, and preview your live inbox.
            </p>
          </div>
          <Link
            href="/notifications"
            className="inline-flex h-9 items-center justify-center rounded-xl bg-neutral-100 px-3 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-200"
          >
            Open full inbox
          </Link>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <NotificationPreferencesForm />

        <Card className="space-y-3 border-neutral-200/80">
          <div>
            <h2 className="text-title-md">Live inbox preview</h2>
            <p className="text-sm text-neutral-600">
              Review unread and recent messages while tuning your preferences.
            </p>
          </div>
          <div className="max-h-[620px] overflow-auto pr-1">
            <NotificationsCenter />
          </div>
        </Card>
      </div>
    </section>
  );
}
