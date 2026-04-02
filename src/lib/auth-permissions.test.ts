import { describe, expect, it } from "vitest";
import { hasAdminAccess } from "@/lib/admin";

describe("auth permission checks", () => {
  it.each([
    {
      title: "allows admin role with authentication",
      authenticated: true,
      role: "admin",
      expected: true,
    },
    {
      title: "rejects non-admin roles",
      authenticated: true,
      role: "restaurant_staff",
      expected: false,
    },
    {
      title: "rejects anonymous access",
      authenticated: false,
      role: "admin",
      expected: false,
    },
  ])("$title", ({ authenticated, role, expected }) => {
    expect(hasAdminAccess(authenticated, role)).toBe(expected);
  });
});

