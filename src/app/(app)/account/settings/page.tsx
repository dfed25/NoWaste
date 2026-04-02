import { AccountSettingsForm } from "@/components/account/account-settings-form";

export default function AccountSettingsPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-title-lg">Account settings</h1>
        <p className="text-body-sm text-neutral-600">
          Basic profile settings for authenticated users.
        </p>
      </div>
      <AccountSettingsForm />
    </section>
  );
}

