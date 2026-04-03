"use client";

import { useEffect } from "react";
import { markOnboardingSeen } from "@/lib/onboarding-storage";

export function MarkOnboardingSeen() {
  useEffect(() => {
    markOnboardingSeen();
  }, []);
  return null;
}
