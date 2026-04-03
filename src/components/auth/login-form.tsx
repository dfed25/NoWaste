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
import { ADMIN_ROLE_COOKIE } from "@/lib/admin";

type AppRole = "customer" | "restaurant_staff";

function normalizeRole(value: string | null | undefined): AppRole | undefined {
  if (!value) return undefined;
  if (value === "customer") return "customer";
  if (value === "restaurant" || value === "restaurant_staff") return "restaurant_staff";
  return undefined;
}

function routeForRole(role: AppRole) {
  return role === "restaurant_staff" ? "/dashboard" : "/";
}

export function LoginForm() {
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

      pushToast({
        tone: "success",
        title: "Logged in",
      });

      const query =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search)
          : new URLSearchParams();

      const requestedRole = normalizeRole(query.get("role"));
      const metadataRole = normalizeRole(
        (data.user?.user_metadata?.app_role as string | undefined) ??
          (data.user?.user_metadata?.role as string | undefined),
      );

      const role = metadataRole ?? requestedRole ?? "customer";
      document.cookie = `${ADMIN_ROLE_COOKIE}=${role}; Path=/; Max-Age=604800; SameSite=Lax`;

      const next = query.get("next") ?? routeForRole(role);
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
