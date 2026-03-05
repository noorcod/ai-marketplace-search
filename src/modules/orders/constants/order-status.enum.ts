/**
 * Order status enum - High-level aggregate status for the entire order
 * Represents the overall state across all order sources
 */
export enum OrderStatus {
  PENDING = 'Pending',
  VERIFYING_PAYMENT = 'Verifying Payment',
  PAYMENT_FAILED = 'Payment Failed',
  IN_PROGRESS = 'In Progress',
  PARTIALLY_FULFILLED = 'Partially Fulfilled',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

/**
 * OrderSource status enum - Granular per-shop/location status
 * Tracks the fulfillment status for items from a specific shop
 */
export enum OrderSourceStatus {
  PENDING = 'Pending',
  VERIFYING_PAYMENT = 'Verifying Payment',
  PAYMENT_FAILED = 'Payment Failed',
  CONFIRMED = 'Confirmed',
  PICKED = 'Picked',
  SHIPPED = 'Shipped',
  DELIVERED = 'Delivered',
  CANCELLED = 'Cancelled',
}

/**
 * Array of all order statuses for validation/filtering
 */
export const ALL_ORDER_STATUSES = Object.values(OrderStatus);

/**
 * Array of all order source statuses for validation/filtering
 */
export const ALL_ORDER_SOURCE_STATUSES = Object.values(OrderSourceStatus);
