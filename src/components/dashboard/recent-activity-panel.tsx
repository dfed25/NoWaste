import { Card } from "@/components/ui/card";
import type { DashboardActivityItem } from "@/lib/restaurant-dashboard-metrics";

type Props = {
  activity: DashboardActivityItem[];
  emptyHint?: string;
};

export function RecentActivityPanel({ activity, emptyHint }: Props) {
  return (
    <Card variant="elevated" className="space-y-3">
      <h2 className="text-title-md">Recent activity</h2>
      {activity.length === 0 ? (
        <p className="text-sm text-neutral-500">
          {emptyHint ?? "No recent orders for this restaurant yet."}
        </p>
      ) : (
        <ul className="space-y-2">
          {activity.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700"
            >
              <span className="block">{item.text}</span>
              <span className="text-xs text-neutral-500">
                {new Date(item.at).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
