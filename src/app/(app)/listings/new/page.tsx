import { CreateListingForm } from "@/components/listings/create-listing-form";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_ROLE_COOKIE } from "@/lib/admin";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookies";

export default async function NewListingPage() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get(AUTH_COOKIE_NAME)?.value === "1";
  const role = cookieStore.get(ADMIN_ROLE_COOKIE)?.value;
  if (!isAuthenticated) {
    redirect("/auth/login?next=/listings/new");
  }
  if (role !== "restaurant_staff" && role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <h1 className="text-title-lg">Create surplus listing</h1>
        <p className="text-body-sm text-neutral-600">
          Publish tonight&apos;s surplus with validation, pricing, notes, and
          donation fallback controls.
        </p>
        <Link href="/listings" className="inline-flex text-sm font-medium text-brand-700 hover:underline">
          Back to listings hub
        </Link>
      </div>
      <CreateListingForm />
    </section>
  );
}

