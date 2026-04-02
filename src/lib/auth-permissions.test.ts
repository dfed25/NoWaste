import { describe, expect, it } from "vitest";
import { hasAdminAccess } from "@/lib/admin";

describe("auth permission checks", () => {
  it("allows admin role with authentication", () => {
    expect(hasAdminAccess(true, "admin")).toBe(true);
  });

  it("rejects non-admin roles", () => {
    expect(hasAdminAccess(true, "restaurant_staff")).toBe(false);
  });

  it("rejects anonymous access", () => {
    expect(hasAdminAccess(false, "admin")).toBe(false);
  });
});

