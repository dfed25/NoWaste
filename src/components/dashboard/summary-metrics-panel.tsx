import { Card } from "@/components/ui/card";

const metrics = [
  { label: "Active listings", value: "4" },
  { label: "Reserved tonight", value: "11" },
  { label: "Items left", value: "23" },
  { label: "Donation eligible", value: "2" },
];

export function SummaryMetricsPanel() {
  return (
    <Card variant="elevated" className="space-y-3">
      <h2 className="text-title-md">Summary metrics</h2>
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2"
          >
            <p className="text-xs text-neutral-500">{metric.label}</p>
            <p className="text-lg font-semibold text-neutral-900">{metric.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

