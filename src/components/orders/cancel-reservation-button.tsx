"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Props = {
  orderId: string;
  disabled: boolean;
};

export function CancelReservationButton({ orderId, disabled }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    if (disabled || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}/cancel`, {
        method: "POST",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Unable to cancel reservation");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to cancel reservation");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-1">
      <Button size="sm" variant="secondary" disabled={disabled || isSubmitting} onClick={handleCancel}>
        {disabled ? "Cancellation closed" : isSubmitting ? "Canceling..." : "Cancel reservation"}
      </Button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
