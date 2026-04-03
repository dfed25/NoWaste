import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <section className="space-y-2">
      <h1 className="text-title-md">Log in</h1>
      <p className="text-body-sm text-neutral-600">
        New here? Pick customer or restaurant on{" "}
        <Link href="/get-started" className="font-medium text-brand-700 underline">
          Get started
        </Link>
        . Returning users can sign in below—your checkout details can be remembered on this device.
      </p>
      <LoginForm />
    </section>
  );
}

