import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full min-w-0 max-w-md py-8">
      <Card variant="elevated" className="min-w-0 space-y-4">
        {children}
      </Card>
    </div>
  );
}

