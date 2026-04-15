"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/feedback/toast-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/validation";
import { syncNwSessionFromAccessToken } from "@/lib/auth/sync-nw-session-client";
import { normalizeRole, routeForRole } from "@/lib/admin";
import { sanitizeAuthNextParam } from "@/lib/auth/safe-next-path";

type LoginFormProps = {
  /** Shown when `next` points at restaurant onboarding (e.g. after “sign in first”). */
  returnToRestaurantOnboarding?: boolean;
};

export function LoginForm({ returnToRestaurantOnboarding = false }: LoginFormProps) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        pushToast({
          tone: "error",
          title: "Login failed",
          description: error.message,
        });
        return;
      }

      const query = new URLSearchParams(window.location.search);
      const requestedRole = normalizeRole(query.get("role"));
      const metadataRole = normalizeRole(
        (data.user?.user_metadata?.app_role as string | undefined) ??
          (data.user?.user_metadata?.role as string | undefined),
      );
      const role = metadataRole ?? requestedRole ?? "customer";

      const session = data.session;
      if (session?.access_token) {
        try {
          await syncNwSessionFromAccessToken(session.access_token, { fallbackRole: role });
        } catch {
          /* Network or parse failure; Supabase session still valid — redirect proceeds */
        }
      }

      pushToast({
        tone: "success",
        title: "Logged in",
      });

      const rawNext = query.get("next");
      const next = sanitizeAuthNextParam(rawNext) ?? routeForRole(role);
      router.push(next);
      router.refresh();
    } catch (error) {
      pushToast({
        tone: "error",
        title: "Login error",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      {returnToRestaurantOnboarding ? (
        <p className="rounded-lg border border-brand-100 bg-brand-50/80 px-3 py-2 text-xs text-brand-900">
          Restaurant profile access requires an account. Use the email and password for your restaurant
          staff login.
        </p>
      ) : null}
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Logging in..." : "Log in"}
      </Button>
      <div className="flex items-center justify-between text-xs text-neutral-600">
        <Link href="/auth/reset-password" className="hover:text-neutral-900">
          Forgot password?
        </Link>
        <Link href="/get-started" className="hover:text-neutral-900">
          Choose role
        </Link>
      </div>
    </form>
  );
}
