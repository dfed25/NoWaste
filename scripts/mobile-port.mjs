/**
 * Port for `dev:mobile`, Capacitor live reload (`CAP_SERVER_URL`), and `mobile:*:dev` wait targets.
 * Set either variable; `MOBILE_DEV_PORT` wins if both are set.
 */
export function getMobileDevPort() {
  const raw = process.env.MOBILE_DEV_PORT ?? process.env.MOBILE_PORT ?? "3000";
  const p = Number(raw);
  if (!Number.isInteger(p) || p < 1 || p > 65535) {
    throw new Error(`MOBILE_DEV_PORT / MOBILE_PORT must be an integer 1-65535 (got ${JSON.stringify(raw)})`);
  }
  return p;
}
