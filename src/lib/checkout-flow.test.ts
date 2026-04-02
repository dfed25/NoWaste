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

  it("returns confirmation URL fallback without Stripe key", async () => {
    const request = new Request("http://localhost/api/checkout/session", {
      method: "POST",
      body: JSON.stringify({
        listingId: "l1",
        listingTitle: "Test listing",
        quantity: 1,
        unitPriceCents: 500,
        customer: { name: "Test", email: "test@example.com", phone: "5551112222" },
      }),
    });

    const response = await checkoutPost(request);
    const payload = (await response.json()) as { confirmationUrl?: string };
    expect(response.status).toBe(200);
    expect(payload.confirmationUrl).toContain("/orders/confirmation");
  });
});

