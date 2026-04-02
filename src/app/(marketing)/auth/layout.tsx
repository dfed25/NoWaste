import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md py-8">
      <Card variant="elevated" className="space-y-4">
        {children}
      </Card>
    </div>
  );
}

