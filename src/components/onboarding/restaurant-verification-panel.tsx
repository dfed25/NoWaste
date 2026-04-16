"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/feedback/toast-provider";
import { syncNwSessionFromAccessToken } from "@/lib/auth/sync-nw-session-client";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";

type Channel = "email" | "sms";

export function RestaurantVerificationPanel() {
  const { pushToast } = useToast();
  const [channel, setChannel] = useState<Channel>("email");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"request" | "confirm" | null>(null);

  async function getAccessToken(): Promise<string | null> {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) {
      pushToast({
        tone: "error",
        title: "Session required",
        description: "Sign in again to continue verification.",
      });
      return null;
    }
    return data.session.access_token;
  }

  async function resyncSession(accessToken: string) {
    await syncNwSessionFromAccessToken(accessToken);
  }

  async function requestCode() {
    setBusy("request");
    try {
      const access_token = await getAccessToken();
      if (!access_token) return;
      const res = await fetch("/api/onboarding/restaurant/verify/request", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token, channel }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; debugCode?: string };
      if (!res.ok) {
        pushToast({
          tone: "error",
          title: "Could not send code",
          description: body.error ?? "Try again in a moment.",
        });
        return;
      }
      pushToast({
        tone: "success",
        title: "Code issued",
        description:
          channel === "email"
            ? "In production this would email your business address. For now, check the server log for the code."
            : "In production this would text your business phone. For now, check the server log for the code.",
      });
      if (body.debugCode) {
        pushToast({
          tone: "success",
          title: "Debug code",
          description: `Your verification code is ${body.debugCode}.`,
        });
      }
    } finally {
      setBusy(null);
    }
  }

  async function confirmCode() {
    setBusy("confirm");
    try {
      const access_token = await getAccessToken();
      if (!access_token) return;
      const res = await fetch("/api/onboarding/restaurant/verify/confirm", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token, code: code.trim() }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        pushToast({
          tone: "error",
          title: "Verification failed",
          description: body.error ?? "Check the code and try again.",
        });
        return;
      }
      await resyncSession(access_token);
      pushToast({
        tone: "success",
        title: "Verified",
        description: "Your application is queued for manual review. We will enable listings after approval.",
      });
      window.location.reload();
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="space-y-4 border-brand-100 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-title-md text-neutral-900">Verify your business contact</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Prove you can receive messages at the phone or email you registered. This is a lightweight
          stand-in for SMS/email providers in development.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "email" as const, label: "Email code" },
            { id: "sms" as const, label: "Phone (SMS) code" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setChannel(opt.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition",
              channel === opt.id
                ? "border-brand-600 bg-brand-50 text-brand-900"
                : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <Button
        type="button"
        className="w-full sm:w-auto"
        disabled={busy !== null}
        onClick={() => void requestCode()}
      >
        {busy === "request" ? "Sending…" : "Send verification code"}
      </Button>

      <div className="border-t border-neutral-100 pt-4">
        <Input
          label="Enter the 6-digit code"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <Button
          type="button"
          variant="secondary"
          className="mt-3 w-full sm:w-auto"
          disabled={busy !== null || code.trim().length < 6}
          onClick={() => void confirmCode()}
        >
          {busy === "confirm" ? "Checking…" : "Confirm code"}
        </Button>
      </div>
    </Card>
  );
}
