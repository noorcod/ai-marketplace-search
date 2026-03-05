import { APG_TRANSACTION_TYPE } from '../dto/payments/init-apg.dto';
import {
  APG_MDR_RATES,
  APG_TAX_PERCENT,
  APG_ORDER_STATUS_MAP,
  APG_TRX_STATUS_MAP,
  ApgTransactionStatus,
} from '../constants/apg.constants';

/**
 * Helper utilities for APG payment processing
 */
export class ApgHelper {
  /**
   * Calculate MDR (Merchant Discount Rate) based on transaction type
   */
  static getMdrRate(transactionTypeId: string): number {
    switch (transactionTypeId) {
      case String(APG_TRANSACTION_TYPE.CARD):
        return APG_MDR_RATES.CARD;
      case String(APG_TRANSACTION_TYPE.BNPL):
        return APG_MDR_RATES.BNPL;
      case String(APG_TRANSACTION_TYPE.RAAST):
        return APG_MDR_RATES.RAAST;
      default:
        return 0; // Default to 0 if unknown type
    }
  }

  /**
   * Calculate expected settlement amount after MDR and tax deductions
   */
  static calculateSettlementAmount(transactionAmount: number, mdrPercent: number): number {
    const totalDeduction = mdrPercent + APG_TAX_PERCENT;
    return transactionAmount - (transactionAmount * totalDeduction) / 100;
  }

  /**
   * Map APG transaction status to internal order status
   */
  static mapToOrderStatus(apgStatus: string): string {
    return APG_ORDER_STATUS_MAP[apgStatus as ApgTransactionStatus] || APG_ORDER_STATUS_MAP.default;
  }

  /**
   * Map APG transaction status to internal transaction status
   */
  static mapToTrxStatus(apgStatus: string): string {
    return APG_TRX_STATUS_MAP[apgStatus as ApgTransactionStatus] || APG_TRX_STATUS_MAP.default;
  }

  /**
   * Extract auth token from APG handshake response
   */
  static extractAuthToken(responseBody: any): string | null {
    if (typeof responseBody === 'string') {
      try {
        const parsed = JSON.parse(responseBody);
        return parsed.AuthToken || parsed.auth_token || null;
      } catch {
        return null;
      }
    }

    if (responseBody && (responseBody.AuthToken || responseBody.auth_token)) {
      return responseBody.AuthToken || responseBody.auth_token;
    }

    return null;
  }

  /**
   * Build handshake map string for encryption
   */
  static buildHandshakeMapString(params: {
    channelId: string;
    isRedirectionRequest: string;
    merchantId: string;
    storeId: string;
    returnUrl: string;
    merchantHash: string;
    merchantUsername: string;
    merchantPassword: string;
    trxRef: string;
  }): string {
    return (
      `HS_ChannelId=${params.channelId}` +
      `&HS_IsRedirectionRequest=${params.isRedirectionRequest}` +
      `&HS_MerchantId=${params.merchantId}` +
      `&HS_StoreId=${params.storeId}` +
      `&HS_ReturnURL=${params.returnUrl}` +
      `&HS_MerchantHash=${params.merchantHash}` +
      `&HS_MerchantUsername=${params.merchantUsername}` +
      `&HS_MerchantPassword=${params.merchantPassword}` +
      `&HS_TransactionReferenceNumber=${params.trxRef}`
    );
  }

  /**
   * Build SSO map string for encryption
   */
  static buildSsoMapString(params: {
    authToken: string;
    channelId: string;
    currency: string;
    isBIN: number;
    returnUrl: string;
    merchantId: string;
    storeId: string;
    merchantHash: string;
    merchantUsername: string;
    merchantPassword: string;
    transactionTypeId: number;
    trxRef: string;
    transactionAmount: number;
  }): string {
    return (
      `AuthToken=${params.authToken}` +
      `&RequestHash=` + // Placeholder
      `&ChannelId=${params.channelId}` +
      `&Currency=${params.currency}` +
      `&IsBIN=${params.isBIN}` +
      `&ReturnURL=${params.returnUrl}` +
      `&MerchantId=${params.merchantId}` +
      `&StoreId=${params.storeId}` +
      `&MerchantHash=${params.merchantHash}` +
      `&MerchantUsername=${params.merchantUsername}` +
      `&MerchantPassword=${params.merchantPassword}` +
      `&TransactionTypeId=${params.transactionTypeId}` +
      `&TransactionReferenceNumber=${params.trxRef}` +
      `&TransactionAmount=${params.transactionAmount}`
    );
  }
}
