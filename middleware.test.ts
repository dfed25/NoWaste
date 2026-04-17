import { describe, it, expect, vi, beforeEach } from "vitest";
import { middleware } from "./middleware";

// ---------------------------------------------------------------------------
// Minimal mocks for next/server
// ---------------------------------------------------------------------------

const mockRedirect = vi.fn();
const mockNext = vi.fn();

vi.mock("next/server", () => {
  return {
    NextResponse: {
      redirect: (url: URL) => {
        mockRedirect(url);
        return { type: "redirect", url };
      },
      next: () => {
        mockNext();
        return { type: "next" };
      },
    },
  };
});

// ---------------------------------------------------------------------------
// Helper: build a mock NextRequest-like object
// ---------------------------------------------------------------------------

function createRequest(
  pathname: string,
  cookieValue?: string,
): {
  nextUrl: { pathname: string };
  url: string;
  cookies: { get: (name: string) => { value: string } | undefined };
} {
  const baseUrl = "http://localhost:3000";
  return {
    nextUrl: { pathname },
    url: `${baseUrl}${pathname}`,
    cookies: {
      get: (name: string) => {
        if (name === "nw-authenticated" && cookieValue !== undefined) {
          return { value: cookieValue };
        }
        return undefined;
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("middleware", () => {
  beforeEach(() => {
    mockRedirect.mockClear();
    mockNext.mockClear();
  });

  // -------------------------------------------------------------------------
  // Protected routes – unauthenticated
  // -------------------------------------------------------------------------
  describe("protected routes – unauthenticated user", () => {
    const protectedPaths = [
      "/dashboard",
      "/listings",
      "/orders",
      "/account",
      "/onboarding",
    ];

    it.each(protectedPaths)(
      "redirects to /auth/login for %s when not authenticated",
      (path) => {
        const request = createRequest(path);
        const result = middleware(request as any);

        expect(mockRedirect).toHaveBeenCalledOnce();
        const redirectUrl: URL = mockRedirect.mock.calls[0][0];
        expect(redirectUrl.pathname).toBe("/auth/login");
        expect(redirectUrl.searchParams.get("next")).toBe(path);
        expect(result).toEqual({ type: "redirect", url: redirectUrl });
      },
    );

    it("redirects nested protected path with correct next param", () => {
      const request = createRequest("/dashboard/settings");
      middleware(request as any);

      expect(mockRedirect).toHaveBeenCalledOnce();
      const redirectUrl: URL = mockRedirect.mock.calls[0][0];
      expect(redirectUrl.pathname).toBe("/auth/login");
      expect(redirectUrl.searchParams.get("next")).toBe("/dashboard/settings");
    });

    it("redirects /listings/123/edit with correct next param", () => {
      const request = createRequest("/listings/123/edit");
      middleware(request as any);

      const redirectUrl: URL = mockRedirect.mock.calls[0][0];
      expect(redirectUrl.searchParams.get("next")).toBe("/listings/123/edit");
    });

    it("redirects when cookie exists but value is not '1'", () => {
      const request = createRequest("/dashboard", "0");
      middleware(request as any);

      expect(mockRedirect).toHaveBeenCalledOnce();
      const redirectUrl: URL = mockRedirect.mock.calls[0][0];
      expect(redirectUrl.pathname).toBe("/auth/login");
    });

    it("redirects when cookie value is empty string", () => {
      const request = createRequest("/account", "");
      middleware(request as any);

      expect(mockRedirect).toHaveBeenCalledOnce();
    });

    it("redirects when cookie value is 'true' (not exactly '1')", () => {
      const request = createRequest("/orders", "true");
      middleware(request as any);

      expect(mockRedirect).toHaveBeenCalledOnce();
    });

    it("does not call NextResponse.next() when redirecting unauthenticated user", () => {
      const request = createRequest("/dashboard");
      middleware(request as any);

      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Protected routes – authenticated
  // -------------------------------------------------------------------------
  describe("protected routes – authenticated user", () => {
    const protectedPaths = [
      "/dashboard",
      "/listings",
      "/orders",
      "/account",
      "/onboarding",
    ];

    it.each(protectedPaths)(
      "allows authenticated user through %s",
      (path) => {
        const request = createRequest(path, "1");
        const result = middleware(request as any);

        expect(mockRedirect).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledOnce();
        expect(result).toEqual({ type: "next" });
      },
    );

    it("allows authenticated user to access nested protected path", () => {
      const request = createRequest("/dashboard/listings/new", "1");
      middleware(request as any);

      expect(mockRedirect).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledOnce();
    });

    it("allows authenticated user to access /onboarding/step/2", () => {
      const request = createRequest("/onboarding/step/2", "1");
      middleware(request as any);

      expect(mockRedirect).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledOnce();
    });
  });

  // -------------------------------------------------------------------------
  // Auth pages – authenticated user
  // -------------------------------------------------------------------------
  describe("auth pages – authenticated user", () => {
    const authPages = [
      "/auth/login",
      "/auth/sign-up",
      "/auth/reset-password",
    ];

    it.each(authPages)(
      "redirects authenticated user away from %s to /dashboard",
      (page) => {
        const request = createRequest(page, "1");
        const result = middleware(request as any);

        expect(mockRedirect).toHaveBeenCalledOnce();
        const redirectUrl: URL = mockRedirect.mock.calls[0][0];
        expect(redirectUrl.pathname).toBe("/dashboard");
        expect(result).toEqual({ type: "redirect", url: redirectUrl });
      },
    );

    it("does not set a 'next' query param when redirecting from auth page", () => {
      const request = createRequest("/auth/login", "1");
      middleware(request as any);

      const redirectUrl: URL = mockRedirect.mock.calls[0][0];
      expect(redirectUrl.searchParams.get("next")).toBeNull();
    });

    it("does not call NextResponse.next() when redirecting authenticated user from auth page", () => {
      const request = createRequest("/auth/sign-up", "1");
      middleware(request as any);

      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Auth pages – unauthenticated user
  // -------------------------------------------------------------------------
  describe("auth pages – unauthenticated user", () => {
    const authPages = [
      "/auth/login",
      "/auth/sign-up",
      "/auth/reset-password",
    ];

    it.each(authPages)(
      "allows unauthenticated user to access %s",
      (page) => {
        const request = createRequest(page);
        const result = middleware(request as any);

        expect(mockRedirect).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledOnce();
        expect(result).toEqual({ type: "next" });
      },
    );
  });

  // -------------------------------------------------------------------------
  // Public / unmatched routes
  // -------------------------------------------------------------------------
  describe("public routes", () => {
    const publicPaths = ["/", "/about", "/contact", "/menu", "/api/health"];

    it.each(publicPaths)(
      "allows any user through public path %s",
      (path) => {
        const request = createRequest(path);
        const result = middleware(request as any);

        expect(mockRedirect).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledOnce();
        expect(result).toEqual({ type: "next" });
      },
    );

    it("allows authenticated user through public path", () => {
      const request = createRequest("/about", "1");
      middleware(request as any);

      expect(mockRedirect).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledOnce();
    });
  });

  // -------------------------------------------------------------------------
  // Cookie edge cases
  // -------------------------------------------------------------------------
  describe("cookie edge cases", () => {
    it("treats missing cookie as unauthenticated on protected route", () => {
      // No cookie value passed → get() returns undefined
      const request = createRequest("/dashboard");
      middleware(request as any);

      expect(mockRedirect).toHaveBeenCalledOnce();
    });

    it("treats cookie value '1' (exactly) as authenticated", () => {
      const request = createRequest("/dashboard", "1");
      middleware(request as any);

      expect(mockRedirect).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledOnce();
    });

    it("treats cookie value ' 1' (with leading space) as unauthenticated", () => {
      const request = createRequest("/dashboard", " 1");
      middleware(request as any);

      expect(mockRedirect).toHaveBeenCalledOnce();
    });

    it("treats cookie value '1 ' (with trailing space) as unauthenticated", () => {
      const request = createRequest("/account", "1 ");
      middleware(request as any);

      expect(mockRedirect).toHaveBeenCalledOnce();
    });

    it("treats cookie value 'false' as unauthenticated", () => {
      const request = createRequest("/listings", "false");
      middleware(request as any);

      expect(mockRedirect).toHaveBeenCalledOnce();
    });
  });

  // -------------------------------------------------------------------------
  // Redirect URL construction
  // -------------------------------------------------------------------------
  describe("redirect URL construction", () => {
    it("builds login redirect URL based on request.url origin", () => {
      const request = createRequest("/dashboard");
      middleware(request as any);

      const redirectUrl: URL = mockRedirect.mock.calls[0][0];
      expect(redirectUrl.origin).toBe("http://localhost:3000");
      expect(redirectUrl.pathname).toBe("/auth/login");
    });

    it("builds dashboard redirect URL based on request.url origin", () => {
      const request = createRequest("/auth/login", "1");
      middleware(request as any);

      const redirectUrl: URL = mockRedirect.mock.calls[0][0];
      expect(redirectUrl.origin).toBe("http://localhost:3000");
      expect(redirectUrl.pathname).toBe("/dashboard");
    });

    it("encodes the next param for paths with special characters", () => {
      const path = "/orders/123%20abc";
      const request = createRequest(path);
      middleware(request as any);

      const redirectUrl: URL = mockRedirect.mock.calls[0][0];
      expect(redirectUrl.searchParams.get("next")).toBe(path);
    });
  });

  // -------------------------------------------------------------------------
  // Route matcher config export
  // -------------------------------------------------------------------------
  describe("config matcher", () => {
    it("exports a config object with matcher array", async () => {
      const { config } = await import("./middleware");
      expect(config).toBeDefined();
      expect(Array.isArray(config.matcher)).toBe(true);
    });

    it("matcher includes all protected prefixes", async () => {
      const { config } = await import("./middleware");
      const matcher = config.matcher.join(",");
      expect(matcher).toContain("/dashboard");
      expect(matcher).toContain("/listings");
      expect(matcher).toContain("/orders");
      expect(matcher).toContain("/account");
      expect(matcher).toContain("/onboarding");
    });

    it("matcher includes auth routes", async () => {
      const { config } = await import("./middleware");
      const matcher = config.matcher.join(",");
      expect(matcher).toContain("/auth");
    });
  });
});