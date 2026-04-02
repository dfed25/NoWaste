import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/jobs/expire-reservations/route";

describe("expire reservations job integration", () => {
  it("returns successful expiration summary", async () => {
    const response = await POST();
    const payload = (await response.json()) as { ok: boolean; totalChecked: number };
    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.totalChecked).toBeGreaterThan(0);
  });
});

