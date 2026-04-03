import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const CUSTOMER_ID_COOKIE_NAME = "nw-user-id";

type ParsedCustomerId = {
  customerId?: string;
  needsResign: boolean;
};

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return "";
  }
}

function getCookieSecret() {
  return process.env.AUTH_SESSION_SECRET ?? process.env.EXPIRE_RESERVATIONS_SECRET;
}

function signCustomerId(customerId: string, secret: string) {
  return createHmac("sha256", secret).update(customerId).digest("hex");
}

function isValidSignature(customerId: string, signature: string, secret: string) {
  const expected = Buffer.from(signCustomerId(customerId, secret));
  const provided = Buffer.from(signature);
  if (expected.length !== provided.length) return false;
  return timingSafeEqual(expected, provided);
}

function isLegacyCustomerId(value: string) {
  // Supports historical values used before signed cookies were introduced.
  if (/^cust_[a-zA-Z0-9-]{8,}$/.test(value)) return true;
  return /^guest:[^\s]+@[^\s]+\.[^\s]+$/i.test(value);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function parseCustomerIdCookie(rawValue: string | undefined): ParsedCustomerId {
  if (!rawValue) return { needsResign: false };

  // Legacy unsigned IDs should be accepted before dot-based signed parsing.
  if (isLegacyCustomerId(rawValue)) {
    return {
      customerId: rawValue,
      needsResign: Boolean(getCookieSecret()),
    };
  }

  const separatorIndex = rawValue.lastIndexOf(".");
  if (separatorIndex === -1) return { needsResign: false };
  if (separatorIndex <= 0 || separatorIndex >= rawValue.length - 1) {
    return { needsResign: false };
  }

  const secret = getCookieSecret();
  if (!secret) return { needsResign: false };

  const customerId = rawValue.slice(0, separatorIndex);
  const signature = rawValue.slice(separatorIndex + 1);
  if (!customerId || !signature) return { needsResign: false };
  if (!isValidSignature(customerId, signature, secret)) return { needsResign: false };

  return { customerId, needsResign: false };
}

export function parseSignedCustomerId(rawValue: string | undefined) {
  return parseCustomerIdCookie(rawValue).customerId;
}

export function parseCustomerIdCookieFromCookieHeader(request: Request): ParsedCustomerId {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieNamePattern = escapeRegExp(CUSTOMER_ID_COOKIE_NAME);
  const pattern = new RegExp(`(?:^|;\\s*)${cookieNamePattern}=([^;]+)`);
  const match = cookieHeader.match(pattern);
  const encoded = match?.[1];
  if (!encoded) return { needsResign: false };
  return parseCustomerIdCookie(safeDecode(encoded));
}

export function parseSignedCustomerIdFromCookieHeader(request: Request) {
  return parseCustomerIdCookieFromCookieHeader(request).customerId;
}

export function encodeSignedCustomerId(customerId: string) {
  const secret = getCookieSecret();
  if (!secret) return undefined;
  const signature = signCustomerId(customerId, secret);
  return `${customerId}.${signature}`;
}

export function createCustomerId() {
  return `cust_${randomUUID()}`;
}

export function getCustomerIdCookieName() {
  return CUSTOMER_ID_COOKIE_NAME;
}
