/** Machine-readable codes returned by order-related APIs (stable client contract). */
export const OrderApiErrorCode = {
  /** Admin GET /api/orders/restaurant without ?restaurantId= */
  ADMIN_RESTAURANT_ID_REQUIRED: "ADMIN_RESTAURANT_ID_REQUIRED",
} as const;
