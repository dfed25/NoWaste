import { SignUpForm } from "@/components/auth/sign-up-form";

export default function SignUpPage() {
  return (
    <section className="space-y-2">
      <h1 className="text-title-md">Create account</h1>
      <p className="text-body-sm text-neutral-600">
        Set up a customer or restaurant account to continue.
      </p>
      <SignUpForm />
    </section>
  );
}

