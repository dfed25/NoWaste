import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { ADMIN_ROLE_COOKIE } from "@/lib/admin";

const AUTH_COOKIE_NAME = "nw-authenticated";
const SIGNATURE_COOKIE_NAME = "nw-session-sig";

type VerifiedSession = {
  isAuthenticated: boolean;
  user?: {
    role?: string;
  };
};

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return "";
  }
}

function parseCookies(cookieHeader: string) {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((value) => value.trim())
      .filter(Boolean)
      .map((pair) => {
        const index = pair.indexOf("=");
        if (index < 0) return [pair, ""];
        const key = pair.slice(0, index);
        const rawValue = pair.slice(index + 1);
        return [key, safeDecode(rawValue)];
      }),
  );
}

function hasValidSignature(value: string, providedSignature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(value).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(providedSignature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function verifyServerSession(request: Request): VerifiedSession {
  const cookies = parseCookies(request.headers.get("cookie") ?? "");
  const isAuthenticated = cookies[AUTH_COOKIE_NAME] === "1";
  const role = cookies[ADMIN_ROLE_COOKIE];
  const signature = cookies[SIGNATURE_COOKIE_NAME];
  const secret = process.env.AUTH_SESSION_SECRET;

  if (!isAuthenticated || !role || !signature || !secret) {
    return { isAuthenticated: false };
  }

  const signedValue = `${AUTH_COOKIE_NAME}=1;${ADMIN_ROLE_COOKIE}=${role}`;
  const isValid = hasValidSignature(signedValue, signature, secret);
  if (!isValid) return { isAuthenticated: false };

  return { isAuthenticated: true, user: { role } };
}

