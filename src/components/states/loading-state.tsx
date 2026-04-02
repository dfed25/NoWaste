import { cn } from "@/lib/cn";

type LoadingStateProps = {
  label?: string;
  className?: string;
};

export function LoadingState({
  label = "Loading...",
  className,
}: LoadingStateProps) {
  return (
    <div className={cn("flex items-center gap-3 text-sm text-neutral-600", className)}>
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-brand-600" />
      <span>{label}</span>
    </div>
  );
}

