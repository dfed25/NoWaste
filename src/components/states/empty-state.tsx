import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center",
        className,
      )}
    >
      <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
      {description ? (
        <p className="mt-1.5 text-sm text-neutral-600">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

