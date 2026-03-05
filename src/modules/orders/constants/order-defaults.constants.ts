/**
 * Default values for order-related numeric fields
 * Centralizes magic strings/numbers for consistency
 */

/** Default decimal value for monetary fields */
export const DEFAULT_DECIMAL = '0.00';

/** Default percentage values */
export const DEFAULT_MDR_PERCENT = '0.00';
export const DEFAULT_TAX_PERCENT = '0.00';
export const DEFAULT_PLATFORM_CHARGES = '0.00';

/** Transaction status values from APG gateway */
export enum TrxStatus {
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  PENDING = 'PENDING',
}

/** Payment method strings used in order payment */
export enum TrxMethod {
  CARD = 'Card',
  CARD_BNPL = 'Card - BNPL',
  RAAST = 'Raast',
  COD = 'COD',
  BANK_TRANSFER = 'Bank Transfer',
}

/** APG-compatible payment methods */
export const APG_PAYMENT_METHODS = [TrxMethod.CARD, TrxMethod.CARD_BNPL, TrxMethod.RAAST];

/**
 * Check if a transaction method requires APG gateway
 */
export function isApgPaymentMethod(trxMethod: string): boolean {
  return APG_PAYMENT_METHODS.includes(trxMethod as TrxMethod);
}
