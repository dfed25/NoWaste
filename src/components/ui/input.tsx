import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  label?: string;
};

export function Input({ className, error, label, id, ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <label className="flex flex-col gap-1.5 text-sm">
      {label ? <span className="font-medium text-neutral-800">{label}</span> : null}
      <input
        id={inputId}
        className={cn(
          "h-11 rounded-xl border bg-white px-3 text-base text-neutral-900",
          "outline-none ring-0 transition-colors placeholder:text-neutral-400",
          "focus-visible:border-brand-500",
          error ? "border-red-500" : "border-neutral-300",
          className,
        )}
        {...props}
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

