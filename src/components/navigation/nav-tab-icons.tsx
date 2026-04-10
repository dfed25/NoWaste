import { cn } from "@/lib/cn";

const base = "h-[1.125rem] w-[1.125rem] shrink-0";

export function NavIconHome({ className }: { className?: string }) {
  return (
    <svg className={cn(base, "text-current", className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NavIconSaved({ className }: { className?: string }) {
  return (
    <svg className={cn(base, "text-current", className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 4.5 14.1 9l5 .5-3.8 3.4 1.1 4.9L12 15.9 7.6 17.8l1.1-4.9L4.9 9.5l5-.5L12 4.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NavIconOrders({ className }: { className?: string }) {
  return (
    <svg className={cn(base, "text-current", className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 6h13M8 12h13M8 18h13M4 6h.01M4 12h.01M4 18h.01"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function NavIconBell({ className }: { className?: string }) {
  return (
    <svg className={cn(base, "text-current", className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm8-4H4l1.7-1.7A2 2 0 0 0 7 14.2V11a5 5 0 1 1 10 0v3.2a2 2 0 0 0 .3 1.1L20 18Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NavIconUser({ className }: { className?: string }) {
  return (
    <svg className={cn(base, "text-current", className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 21a8 8 0 1 0-16 0M12 13a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function NavIconGrid({ className }: { className?: string }) {
  return (
    <svg className={cn(base, "text-current", className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4.5 4.5h6v6h-6v-6Zm9 0h6v6h-6v-6Zm-9 9h6v6h-6v-6Zm9 0h6v6h-6v-6Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NavIconQueue({ className }: { className?: string }) {
  return (
    <svg className={cn(base, "text-current", className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 6h13M8 12h13M5 6h.01M5 12h.01M4 18h16"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function NavIconPlaceholder({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-block h-[1.125rem] w-[1.125rem] rounded border border-neutral-300", className)}
      aria-hidden
    />
  );
}
