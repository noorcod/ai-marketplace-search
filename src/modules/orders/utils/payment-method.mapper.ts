import { PaymentMethod } from '../dto/checkout/checkout.dto';
import { APG_TRANSACTION_TYPE } from '../dto/payments/init-apg.dto';
import { TrxMethod } from '../dto/payments/order-payment.dto';

/**
 * Utility class for mapping payment methods to different formats
 */
export class PaymentMethodMapper {
  /**
   * Map PaymentMethod enum to APG transaction type
   */
  static toApgTransactionType(paymentMethod: PaymentMethod): APG_TRANSACTION_TYPE {
    const mapping: Record<PaymentMethod, APG_TRANSACTION_TYPE> = {
      [PaymentMethod.CARD]: APG_TRANSACTION_TYPE.CARD,
      [PaymentMethod.RAAST]: APG_TRANSACTION_TYPE.RAAST,
      [PaymentMethod.BNPL]: APG_TRANSACTION_TYPE.BNPL,
      [PaymentMethod.COD]: APG_TRANSACTION_TYPE.CARD, // Not used for COD
      [PaymentMethod.BANK_TRANSFER]: APG_TRANSACTION_TYPE.CARD, // Not used for Bank Transfer
    };
    return mapping[paymentMethod];
  }

  /**
   * Map PaymentMethod enum to TrxMethod
   */
  static toTrxMethod(paymentMethod: PaymentMethod): TrxMethod {
    const mapping: Record<PaymentMethod, TrxMethod> = {
      [PaymentMethod.COD]: TrxMethod.Cash,
      [PaymentMethod.BANK_TRANSFER]: TrxMethod.BankTransfer,
      [PaymentMethod.CARD]: TrxMethod.Card,
      [PaymentMethod.RAAST]: TrxMethod.Raast,
      [PaymentMethod.BNPL]: TrxMethod.Card_BNPL,
    };
    return mapping[paymentMethod];
  }

  /**
   * Check if payment method requires APG gateway
   */
  static requiresApgGateway(paymentMethod: PaymentMethod): boolean {
    return [PaymentMethod.CARD, PaymentMethod.RAAST, PaymentMethod.BNPL].includes(paymentMethod);
  }

  /**
   * Check if payment method is cash-based (no gateway)
   */
  static isCashBased(paymentMethod: PaymentMethod): boolean {
    return [PaymentMethod.COD, PaymentMethod.BANK_TRANSFER].includes(paymentMethod);
  }
}
