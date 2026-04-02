import { describe, expect, it } from "vitest";
import { hasAdminAccess } from "@/lib/admin";

describe("admin authorization", () => {
  it("allows authenticated admin", () => {
    expect(hasAdminAccess(true, "admin")).toBe(true);
  });

  it("denies authenticated non-admin", () => {
    expect(hasAdminAccess(true, "customer")).toBe(false);
  });
});

