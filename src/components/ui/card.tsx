import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type CardVariant = "default" | "elevated" | "outlined";

const variantClasses: Record<CardVariant, string> = {
  default: "bg-white border border-neutral-200",
  elevated: "bg-white shadow-sm border border-neutral-100",
  outlined: "bg-white border-2 border-neutral-300",
};

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
};

export function Card({ className, variant = "default", ...props }: CardProps) {
  return (
    <div
      className={cn("rounded-2xl p-4 md:p-5", variantClasses[variant], className)}
      {...props}
    />
  );
}

