import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <section className="min-w-0 space-y-2">
      <h1 className="text-title-md">Log in</h1>
      <p className="text-body-sm text-neutral-600">
        Sign in to access protected marketplace routes.
      </p>
      <LoginForm />
    </section>
  );
}

