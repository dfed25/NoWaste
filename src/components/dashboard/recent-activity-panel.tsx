import { Card } from "@/components/ui/card";

const activity = [
  "Order #ORD-441 reserved for 8:30 PM pickup window.",
  "Listing \"Prepared bowls\" was published.",
  "Donation fallback triggered for \"Salad mix boxes\".",
  "Pickup marked as picked_up for order #ORD-430.",
];

export function RecentActivityPanel() {
  return (
    <Card variant="elevated" className="space-y-3">
      <h2 className="text-title-md">Recent activity</h2>
      <ul className="space-y-2">
        {activity.map((item) => (
          <li
            key={item}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700"
          >
            {item}
          </li>
        ))}
      </ul>
    </Card>
  );
}

