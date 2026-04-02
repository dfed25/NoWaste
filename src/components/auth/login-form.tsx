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
      const { error } = await supabase.auth.signInWithPassword({
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

      const next =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("next") ||
            "/dashboard"
          : "/dashboard";
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
        <Link href="/auth/sign-up" className="hover:text-neutral-900">
          Create account
        </Link>
      </div>
    </form>
  );
}

