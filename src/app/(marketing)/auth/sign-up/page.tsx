import Link from "next/link";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { normalizeRole, type PublicSignUpRole } from "@/lib/admin";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type Props = {
  searchParams: SearchParams;
};

function isPublicSignUpRole(role: ReturnType<typeof normalizeRole>): role is PublicSignUpRole {
  return role === "customer" || role === "restaurant_staff";
}

export default async function SignUpPage({ searchParams }: Props) {
  const query = await searchParams;
  const rawRole = Array.isArray(query.role) ? query.role[0] : query.role;
  const normalized = normalizeRole(rawRole);

  if (!normalized) {
    return (
      <section className="space-y-3">
        <h1 className="text-title-md">Choose your account type first</h1>
        <p className="text-body-sm text-neutral-600">
          Start by selecting whether you are a customer or restaurant.
        </p>
        <Link href="/get-started" className="text-sm font-medium text-brand-700 underline">
          Go to role selection
        </Link>
      </section>
    );
  }

  if (!isPublicSignUpRole(normalized)) {
    return (
      <section className="space-y-3">
        <h1 className="text-title-md">Sign-up not available</h1>
        <p className="text-body-sm text-neutral-600">
          This account type cannot be created from the public sign-up page. Please use the link your
          administrator provided or choose a different role.
        </p>
        <Link href="/get-started" className="text-sm font-medium text-brand-700 underline">
          Go to role selection
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h1 className="text-title-md">Create account</h1>
      {normalized === "restaurant_staff" ? (
        <p className="text-body-sm text-neutral-600">
          Restaurant accounts require business details and confirmation that you represent a food
          service venue. After you verify your email (if required by your workspace), sign in to
          finish location onboarding.
        </p>
      ) : (
        <p className="text-body-sm text-neutral-600">Set up your customer account to continue.</p>
      )}
      <SignUpForm role={normalized} />
    </section>
  );
}
