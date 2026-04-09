/** Listing / order display status used by `StatusIndicator` and dashboard metrics. */
export type StatusIndicatorStatus =
  | "draft"
  | "active"
  | "reserved"
  | "picked_up"
  | "missed_pickup"
  | "expired"
  | "donation_eligible"
  | "donation_claimed"
  | "donated"
  | "donation_failed";
