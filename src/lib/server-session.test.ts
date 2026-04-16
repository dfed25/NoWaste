import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buildLegacyStaffNwSessionCanonical,
  buildNwSessionCanonical,
  NW_SESSION_SIGNATURE_COOKIE_NAME,
  signNwSessionCanonical,
  verifyServerSession,
} from "@/lib/server-session";
import { ADMIN_ROLE_COOKIE } from "@/lib/admin";
import {
  AUTH_COOKIE_NAME,
  NW_RESTAURANT_APP_STATUS_COOKIE_NAME,
  RESTAURANT_ID_COOKIE_NAME,
} from "@/lib/auth-cookies";

describe("server-session", () => {
  beforeEach(() => {
    process.env.AUTH_SESSION_SECRET = "unit-test-session-secret";
  });

  afterEach(() => {
    delete process.env.AUTH_SESSION_SECRET;
  });

  function requestWithCookies(parts: string[]) {
    return new Request("http://localhost/", {
      headers: { cookie: parts.join("; ") },
    });
  }

  it("accepts staff session when restaurant id + app status match signed canonical", () => {
    const role = "restaurant_staff";
    const restaurantId = "r1";
    const appStatus = "pending_verification";
    const canonical = buildNwSessionCanonical(role, restaurantId, appStatus);
    const sig = signNwSessionCanonical(canonical, process.env.AUTH_SESSION_SECRET!);
    const req = requestWithCookies([
      `${AUTH_COOKIE_NAME}=1`,
      `${ADMIN_ROLE_COOKIE}=${role}`,
      `${RESTAURANT_ID_COOKIE_NAME}=${restaurantId}`,
      `${NW_RESTAURANT_APP_STATUS_COOKIE_NAME}=${appStatus}`,
      `${NW_SESSION_SIGNATURE_COOKIE_NAME}=${sig}`,
    ]);
    const v = verifyServerSession(req);
    expect(v.isAuthenticated).toBe(true);
    expect(v.user?.role).toBe(role);
    expect(v.user?.scopedRestaurantId).toBe(restaurantId);
    expect(v.user?.restaurantApplicationStatus).toBe("pending_verification");
  });

  it("accepts legacy three-part staff canonical (pre–app-status rollout)", () => {
    const role = "restaurant_staff";
    const restaurantId = "r1";
    const canonical = buildLegacyStaffNwSessionCanonical(restaurantId);
    const sig = signNwSessionCanonical(canonical, process.env.AUTH_SESSION_SECRET!);
    const req = requestWithCookies([
      `${AUTH_COOKIE_NAME}=1`,
      `${ADMIN_ROLE_COOKIE}=${role}`,
      `${RESTAURANT_ID_COOKIE_NAME}=${restaurantId}`,
      `${NW_SESSION_SIGNATURE_COOKIE_NAME}=${sig}`,
    ]);
    const v = verifyServerSession(req);
    expect(v.isAuthenticated).toBe(true);
    expect(v.user?.role).toBe(role);
    expect(v.user?.scopedRestaurantId).toBe(restaurantId);
    expect(v.user?.restaurantApplicationStatus).toBe("approved");
  });

  it("accepts staff session when restaurant id is empty (unscoped onboarding)", () => {
    const role = "restaurant_staff";
    const restaurantId = "";
    const appStatus = "pending_verification";
    const canonical = buildNwSessionCanonical(role, restaurantId, appStatus);
    const sig = signNwSessionCanonical(canonical, process.env.AUTH_SESSION_SECRET!);
    const req = requestWithCookies([
      `${AUTH_COOKIE_NAME}=1`,
      `${ADMIN_ROLE_COOKIE}=${role}`,
      `${RESTAURANT_ID_COOKIE_NAME}=`,
      `${NW_RESTAURANT_APP_STATUS_COOKIE_NAME}=${appStatus}`,
      `${NW_SESSION_SIGNATURE_COOKIE_NAME}=${sig}`,
    ]);
    const v = verifyServerSession(req);
    expect(v.isAuthenticated).toBe(true);
    expect(v.user?.role).toBe(role);
    expect(v.user?.scopedRestaurantId).toBe("");
  });

  it("rejects staff when restaurant cookie does not match signature", () => {
    const role = "restaurant_staff";
    const appStatus = "approved";
    const canonical = buildNwSessionCanonical(role, "r1", appStatus);
    const sig = signNwSessionCanonical(canonical, process.env.AUTH_SESSION_SECRET!);
    const req = requestWithCookies([
      `${AUTH_COOKIE_NAME}=1`,
      `${ADMIN_ROLE_COOKIE}=${role}`,
      `${RESTAURANT_ID_COOKIE_NAME}=r2`,
      `${NW_RESTAURANT_APP_STATUS_COOKIE_NAME}=${appStatus}`,
      `${NW_SESSION_SIGNATURE_COOKIE_NAME}=${sig}`,
    ]);
    const v = verifyServerSession(req);
    expect(v.isAuthenticated).toBe(false);
  });

  it("accepts legacy two-part admin signature", () => {
    const role = "admin";
    const legacy = `${AUTH_COOKIE_NAME}=1;${ADMIN_ROLE_COOKIE}=${role}`;
    const sig = signNwSessionCanonical(legacy, process.env.AUTH_SESSION_SECRET!);
    const req = requestWithCookies([
      `${AUTH_COOKIE_NAME}=1`,
      `${ADMIN_ROLE_COOKIE}=${role}`,
      `${NW_SESSION_SIGNATURE_COOKIE_NAME}=${sig}`,
    ]);
    const v = verifyServerSession(req);
    expect(v.isAuthenticated).toBe(true);
    expect(v.user?.role).toBe("admin");
    expect(v.user?.scopedRestaurantId).toBeUndefined();
  });
});
