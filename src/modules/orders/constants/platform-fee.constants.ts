/**
 * Platform Fee Configuration Constants
 * Centralizes all platform fee calculations and percentages
 */

/**
 * Platform fee percentages by payment method
 * These fees are added on top of the order amount
 */
export const PLATFORM_FEE_RATES = {
  /** Card payment: 6.48% (3.48% MDR + 3% Tax) */
  CARD: 0.0648,

  /** Buy Now Pay Later: 13% (10% MDR + 3% Tax) */
  BNPL: 0.13,

  /** Raast instant payment: 3% (0% MDR + 3% Tax) */
  RAAST: 0.03,

  /** Cash on Delivery: No platform fee */
  CASH: 0,

  /** Bank Transfer: No platform fee */
  BANK_TRANSFER: 0,
} as const;

/**
 * BNPL-specific markup percentage
 * Applied to product subtotal for BNPL orders
 */
export const BNPL_MARKUP_PERCENT = 0.1; // 10%

/**
 * Price validation tolerance values (in PKR)
 */
export const PRICE_VALIDATION_TOLERANCE = {
  /** Tolerance for base prices and cash payments */
  BASE: 0.01,

  /** Tolerance for APG payments (due to Math.ceil rounding) */
  APG: 0.5,
} as const;

/**
 * Calculate platform fee based on payment method
 * @param baseAmount - Order amount before platform fee (subtotal + delivery - voucher)
 * @param paymentMethod - Payment method enum value
 * @returns Platform fee amount (rounded up using Math.ceil)
 */
export function calculatePlatformFee(baseAmount: number, feeRate: number): number {
  if (feeRate === 0) return 0;

  const grandTotal = baseAmount / (1 - feeRate);
  return Math.ceil(grandTotal - baseAmount);
}

/**
 * Calculate BNPL-specific platform fee
 * BNPL has special logic: platform fee calculated on original price,
 * but subtotal includes 10% markup
 */
export function calculateBnplPlatformFee(
  subtotal: number,
  deliveryCharges: number,
  voucherDiscount: number,
): {
  platformFee: number;
  grandTotal: number;
  subtotalWithMarkup: number;
} {
  // Calculate platform fee on original price (without markup)
  const baseForPlatformCalc = subtotal + deliveryCharges - voucherDiscount;
  const grandTotal = baseForPlatformCalc / (1 - PLATFORM_FEE_RATES.BNPL);

  // Subtotal includes 10% markup for display
  const subtotalWithMarkup = subtotal * (1 + BNPL_MARKUP_PERCENT);

  // Platform fee = difference between grandTotal and marked-up amounts
  const platformFee = Math.ceil(grandTotal - subtotalWithMarkup - deliveryCharges + voucherDiscount);

  return {
    platformFee,
    grandTotal: Math.ceil(grandTotal),
    subtotalWithMarkup,
  };
}

/**
 * Get platform fee rate for a given payment method
 */
export function getPlatformFeeRate(trxMethod: string): number {
  switch (trxMethod) {
    case 'Card':
      return PLATFORM_FEE_RATES.CARD;
    case 'Card - BNPL':
      return PLATFORM_FEE_RATES.BNPL;
    case 'Raast':
      return PLATFORM_FEE_RATES.RAAST;
    case 'Cash':
    case 'COD':
      return PLATFORM_FEE_RATES.CASH;
    case 'Bank Transfer':
      return PLATFORM_FEE_RATES.BANK_TRANSFER;
    default:
      return 0;
  }
}

/**
 * Check if payment method requires platform fee
 */
export function requiresPlatformFee(trxMethod: string): boolean {
  return getPlatformFeeRate(trxMethod) > 0;
}
