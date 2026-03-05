import { Injectable, Logger } from '@nestjs/common';
import { OrderCreationService } from './order-creation.service';
import { ApgService } from '../apg.service';
import { CheckoutDto } from '../dto/checkout/checkout.dto';
import { PaymentMethodMapper } from '../utils/payment-method.mapper';
import { CheckoutException, UnsupportedPaymentMethodException } from '../exceptions/order.exceptions';

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    private readonly orderCreationService: OrderCreationService,
    private readonly apgService: ApgService,
  ) {}

  /**
   * Process checkout based on payment method
   */
  async processCheckout(userId: string, checkoutDto: CheckoutDto) {
    const { paymentMethod } = checkoutDto;

    try {
      // Route to appropriate payment flow
      if (PaymentMethodMapper.requiresApgGateway(paymentMethod)) {
        return this.processApgPayment(userId, checkoutDto);
      }

      if (PaymentMethodMapper.isCashBased(paymentMethod)) {
        return this.processCashBasedPayment(userId, checkoutDto);
      }

      throw new UnsupportedPaymentMethodException(paymentMethod);
    } catch (error) {
      this.logger.error(`Checkout failed: ${error.message}`, error.stack);

      // Re-throw known exceptions
      if (error instanceof UnsupportedPaymentMethodException) {
        throw error;
      }

      // Wrap unknown errors
      throw new CheckoutException(error.message);
    }
  }

  /**
   * Process payment through APG gateway (CARD, RAAST, BNPL)
   */
  private async processApgPayment(userId: string, checkoutDto: CheckoutDto) {
    try {
      const { paymentMethod, cartItems, deliveryAddress, deliveryChargeAmount, voucherId, amountReceivable } =
        checkoutDto;

      const transactionTypeId = PaymentMethodMapper.toApgTransactionType(paymentMethod);
      const trxMethod = PaymentMethodMapper.toTrxMethod(paymentMethod);

      const apgData = {
        cartItems,
        deliveryAddress,
        deliveryChargeAmount,
        voucherId,
        transactionTypeId,
        paymentDetails: {
          amountReceivable: amountReceivable ?? 0,
          trxMethod,
        },
      };

      return this.apgService.initHandShakeAndSSO(apgData, userId);
    } catch (error) {
      this.logger.error(`APG payment processing failed: ${error.message}`, error.stack);
      throw error; // Re-throw to be handled by parent
    }
  }

  /**
   * Process cash-based payment (COD, Bank Transfer)
   */
  private async processCashBasedPayment(userId: string, checkoutDto: CheckoutDto) {
    try {
      const { paymentMethod, cartItems, deliveryAddress, deliveryChargeAmount, voucherId, amountReceivable } =
        checkoutDto;

      const trxMethod = PaymentMethodMapper.toTrxMethod(paymentMethod);

      const createOrderDto = {
        cartItems,
        deliveryAddress,
        deliveryChargeAmount,
        voucherId,
        paymentDetails: {
          amountReceivable: amountReceivable ?? 0,
          trxMethod,
        },
      };

      return await this.orderCreationService.createOrder(userId, createOrderDto);
    } catch (error) {
      this.logger.error(`Cash-based payment processing failed: ${error.message}`, error.stack);
      throw error; // Re-throw to be handled by parent
    }
  }
}
