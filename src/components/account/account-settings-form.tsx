"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/feedback/toast-provider";
import {
  accountSettingsSchema,
  type AccountSettingsInput,
} from "@/lib/validation";

export function AccountSettingsForm() {
  const { pushToast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AccountSettingsInput>({
    resolver: zodResolver(accountSettingsSchema),
    defaultValues: {
      displayName: "",
      email: "",
      phone: "",
    },
  });

  return (
    <Card className="space-y-4">
      <h2 className="text-title-md">Account settings</h2>
      <form
        className="grid gap-3"
        onSubmit={handleSubmit(async () => {
          pushToast({
            tone: "success",
            title: "Settings saved",
            description: "Profile persistence is the next backend task.",
          });
        })}
      >
        <Input
          label="Display name"
          error={errors.displayName?.message}
          {...register("displayName")}
        />
        <Input
          label="Email"
          type="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Phone"
          error={errors.phone?.message}
          {...register("phone")}
        />
        <div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

