/**
 * Legacy path: Stripe Dashboard may still point here. Canonical handler lives at
 * `POST /api/stripe/webhook` (full inventory + idempotency). Re-export to avoid drift.
 */
export { POST } from "@/app/api/stripe/webhook/route";
