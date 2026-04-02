import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type ErrorStateProps = {
  title?: string;
  message: string;
  action?: ReactNode;
  className?: string;
};

export function ErrorState({
  title = "Something went wrong",
  message,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-red-200 bg-red-50 p-4 text-sm",
        className,
      )}
    >
      <h3 className="font-semibold text-red-900">{title}</h3>
      <p className="mt-1 text-red-700">{message}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

