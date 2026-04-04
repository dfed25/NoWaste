import { Badge } from "@/components/ui/badge";
import type { StatusIndicatorStatus } from "@/lib/status-indicator-status";

export type { StatusIndicatorStatus } from "@/lib/status-indicator-status";

const statusVariantMap: Record<
  StatusIndicatorStatus,
  "neutral" | "success" | "warning" | "danger" | "brand"
> = {
  draft: "neutral",
  active: "brand",
  reserved: "warning",
  picked_up: "success",
  missed_pickup: "danger",
  expired: "neutral",
  donation_eligible: "warning",
  donation_claimed: "brand",
  donated: "success",
  donation_failed: "danger",
};

type Props = {
  status: StatusIndicatorStatus;
};

export function StatusIndicator({ status }: Props) {
  return (
    <Badge variant={statusVariantMap[status]}>
      {status.replaceAll("_", " ")}
    </Badge>
  );
}
