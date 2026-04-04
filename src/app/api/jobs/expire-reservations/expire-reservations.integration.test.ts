import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/jobs/expire-reservations/route";

describe("expire reservations job integration", () => {
  it("returns successful expiration summary", async () => {
    const previousSecret = process.env.EXPIRE_RESERVATIONS_SECRET;
    process.env.EXPIRE_RESERVATIONS_SECRET = "test-secret";
    try {
      const response = await POST(
        new Request("http://localhost/api/jobs/expire-reservations", {
          method: "POST",
          headers: { "x-job-secret": "test-secret" },
        }),
      );
      const payload = (await response.json()) as {
        ok: boolean;
        totalChecked: number;
        expiredCount: number;
      };
      expect(response.status).toBe(200);
      expect(payload.ok).toBe(true);
      expect(typeof payload.totalChecked).toBe("number");
      expect(typeof payload.expiredCount).toBe("number");
    } finally {
      if (previousSecret === undefined) delete process.env.EXPIRE_RESERVATIONS_SECRET;
      else process.env.EXPIRE_RESERVATIONS_SECRET = previousSecret;
    }
  });
});

