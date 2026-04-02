import { PasswordResetForm } from "@/components/auth/password-reset-form";

export default function ResetPasswordPage() {
  return (
    <section className="space-y-2">
      <h1 className="text-title-md">Reset password</h1>
      <p className="text-body-sm text-neutral-600">
        We will email a reset link to this address.
      </p>
      <PasswordResetForm />
    </section>
  );
}

