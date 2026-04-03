import { describe, expect, it } from "vitest";
import { POST as checkoutPost } from "@/app/api/checkout/session/route";

describe("checkout success/failure flow", () => {
  it("returns 400 on invalid request", async () => {
    const request = new Request("http://localhost/api/checkout/session", {
      method: "POST",
      body: JSON.stringify({
        listingId: "",
        listingTitle: "",
        quantity: 0,
      }),
    });

    const response = await checkoutPost(request);
    expect(response.status).toBe(400);
  });

  it("returns 400 when quantity is zero with valid listing fields", async () => {
    const request = new Request("http://localhost/api/checkout/session", {
      method: "POST",
      body: JSON.stringify({
        listingId: "l1",
        listingTitle: "Valid listing",
        quantity: 0,
        customer: { name: "Test", email: "test@example.com", phone: "5551112222" },
      }),
    });

    const response = await checkoutPost(request);
    expect(response.status).toBe(400);
  });

  it("returns confirmation URL fallback without Stripe key", async () => {
    const previousStripeKey = process.env.STRIPE_SECRET_KEY;
    const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    const previousAuthSessionSecret = process.env.AUTH_SESSION_SECRET;
    delete process.env.STRIPE_SECRET_KEY;
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    process.env.AUTH_SESSION_SECRET = "test-session-secret";
    try {
      const request = new Request("http://localhost/api/checkout/session", {
        method: "POST",
        body: JSON.stringify({
          listingId: "l1",
          listingTitle: "Test listing",
          quantity: 1,
          customer: { name: "Test", email: "test@example.com", phone: "5551112222" },
        }),
      });

      const response = await checkoutPost(request);
      const payload = (await response.json()) as { confirmationUrl?: string };
      expect(response.status).toBe(200);
      expect(payload.confirmationUrl).toContain("/orders/confirmation");
    } finally {
      if (previousStripeKey === undefined) delete process.env.STRIPE_SECRET_KEY;
      else process.env.STRIPE_SECRET_KEY = previousStripeKey;
      if (previousAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
      else process.env.NEXT_PUBLIC_APP_URL = previousAppUrl;
      if (previousAuthSessionSecret === undefined) delete process.env.AUTH_SESSION_SECRET;
      else process.env.AUTH_SESSION_SECRET = previousAuthSessionSecret;
    }
  });
});

