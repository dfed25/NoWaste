import { describe, expect, it } from "vitest";
import {
  isReturnToRestaurantOnboarding,
  RESTAURANT_ONBOARDING_LOGIN_HREF,
  RESTAURANT_ONBOARDING_PATH,
  sanitizeAuthNextParam,
} from "./safe-next-path";

describe("sanitizeAuthNextParam", () => {
  it("accepts safe relative paths", () => {
    expect(sanitizeAuthNextParam("/dashboard")).toBe("/dashboard");
    expect(sanitizeAuthNextParam(" /onboarding/restaurant ")).toBe("/onboarding/restaurant");
  });

  it("rejects open redirects", () => {
    expect(sanitizeAuthNextParam("//evil.com")).toBeNull();
    expect(sanitizeAuthNextParam("https://evil.com")).toBeNull();
    expect(sanitizeAuthNextParam(null)).toBeNull();
    expect(sanitizeAuthNextParam("")).toBeNull();
  });
});

describe("isReturnToRestaurantOnboarding", () => {
  it("matches sanitized onboarding path", () => {
    expect(isReturnToRestaurantOnboarding(RESTAURANT_ONBOARDING_PATH)).toBe(true);
    expect(isReturnToRestaurantOnboarding(`${RESTAURANT_ONBOARDING_PATH}?x=1`)).toBe(true);
    expect(isReturnToRestaurantOnboarding(`${RESTAURANT_ONBOARDING_PATH}#section`)).toBe(true);
    expect(isReturnToRestaurantOnboarding("/")).toBe(false);
    expect(isReturnToRestaurantOnboarding(null)).toBe(false);
  });
});

describe("RESTAURANT_ONBOARDING_LOGIN_HREF", () => {
  it("includes encoded next and restaurant role", () => {
    expect(RESTAURANT_ONBOARDING_LOGIN_HREF).toContain(
      `next=${encodeURIComponent(RESTAURANT_ONBOARDING_PATH)}`,
    );
    expect(RESTAURANT_ONBOARDING_LOGIN_HREF).toContain("role=restaurant");
  });
});
