import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const CUSTOMER_ID_COOKIE_NAME = "nw-user-id";

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

export function parseSignedCustomerId(rawValue: string | undefined) {
  if (!rawValue) return undefined;
  const secret = getCookieSecret();
  if (!secret) return undefined;

  const separatorIndex = rawValue.lastIndexOf(".");
  if (separatorIndex <= 0 || separatorIndex >= rawValue.length - 1) return undefined;

  const customerId = rawValue.slice(0, separatorIndex);
  const signature = rawValue.slice(separatorIndex + 1);
  if (!customerId || !signature) return undefined;
  if (!isValidSignature(customerId, signature, secret)) return undefined;
  return customerId;
}

export function parseSignedCustomerIdFromCookieHeader(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)nw-user-id=([^;]+)/);
  const encoded = match?.[1];
  if (!encoded) return undefined;
  return parseSignedCustomerId(safeDecode(encoded));
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
