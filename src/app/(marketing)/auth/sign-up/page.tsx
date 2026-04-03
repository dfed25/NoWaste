import Link from "next/link";
import { SignUpForm } from "@/components/auth/sign-up-form";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type Props = {
  searchParams: SearchParams;
};

function normalizeRole(value: string | undefined) {
  if (value === "customer") return "customer" as const;
  if (value === "restaurant" || value === "restaurant_staff") {
    return "restaurant_staff" as const;
  }
  return undefined;
}

export default async function SignUpPage({ searchParams }: Props) {
  const query = await searchParams;
  const rawRole = Array.isArray(query.role) ? query.role[0] : query.role;
  const role = normalizeRole(rawRole);

  if (!role) {
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

  return (
    <section className="space-y-2">
      <h1 className="text-title-md">Create account</h1>
      <p className="text-body-sm text-neutral-600">
        Set up your {role === "restaurant_staff" ? "restaurant" : "customer"} account to continue.
      </p>
      <SignUpForm role={role} />
    </section>
  );
}
