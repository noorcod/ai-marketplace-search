/**
 * APG (Allied Payment Gateway) Configuration Constants
 */

/**
 * MDR (Merchant Discount Rate) percentages by transaction type
 */
export const APG_MDR_RATES = {
  CARD: 3.48, // 3% + 16% FED on 3% (settlement in other bank account)
  BNPL: 10.0, // Buy Now Pay Later
  RAAST: 0.0, // Raast instant payment
} as const;

/**
 * Tax percentage (Sales Tax + Withholding Tax)
 */
export const APG_TAX_PERCENT = 3; // 2% Sales Tax + 1% Withholding Tax

/**
 * APG Transaction Status to Order Status mapping
 */
export const APG_ORDER_STATUS_MAP = {
  Paid: 'Verifying Payment',
  Failed: 'Payment Failed',
  default: 'Pending',
} as const;

/**
 * APG Transaction Status to Internal Transaction Status mapping
 */
export const APG_TRX_STATUS_MAP = {
  Paid: 'APPROVED',
  Failed: 'DECLINED',
  Initiated: 'PENDING',
  default: 'PENDING',
} as const;

/**
 * APG Field Prefixes
 */
export const APG_FIELD_PREFIX = {
  HANDSHAKE: 'HS_',
  SSO: '',
} as const;

/**
 * APG Encryption Configuration
 */
export const APG_ENCRYPTION = {
  ALGORITHM: 'aes-128-cbc',
  KEY_LENGTH: 16, // bytes
  IV_LENGTH: 16, // bytes
} as const;

/**
 * APG API Endpoints (relative paths)
 */
export const APG_ENDPOINTS = {
  ORDER_STATUS: '/HS/api/IPN/OrderStatus',
} as const;

/**
 * Type for APG Transaction Status
 */
export type ApgTransactionStatus = keyof typeof APG_ORDER_STATUS_MAP;

/**
 * Type for APG Internal Transaction Status
 */
export type ApgInternalTrxStatus = (typeof APG_TRX_STATUS_MAP)[keyof typeof APG_TRX_STATUS_MAP];
