import { Card } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-title-lg">About NoWaste</h1>
      <Card>
        <p className="text-body-md text-neutral-700">
          NoWaste connects restaurants, customers, and donation partners to
          reduce food waste with secure, role-based flows.
        </p>
      </Card>
    </section>
  );
}

