import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NotificationsCenter } from "@/components/notifications/notifications-center";

export default function NotificationsPage() {
  return (
    <section className="space-y-5">
      <Card className="space-y-3 border-neutral-200/80 bg-gradient-to-br from-white via-white to-brand-100/25">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand">Inbox</Badge>
              <Badge variant="success">Live updates</Badge>
            </div>
            <h1 className="mt-2 text-title-lg">Notifications center</h1>
            <p className="text-body-sm text-neutral-600">
              Track reservation confirmations, pickup reminders, and account activity in one place.
            </p>
          </div>
          <Link
            href="/account/notifications"
            className="inline-flex h-9 items-center justify-center rounded-xl bg-neutral-100 px-3 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-200"
          >
            Notification preferences
          </Link>
        </div>
      </Card>

      <NotificationsCenter />
    </section>
  );
}
