import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base exception for all order-related errors
 */
export class OrderException extends HttpException {
  constructor(message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, status);
    this.name = 'OrderException';
  }
}

/**
 * Exception thrown when order creation fails
 */
export class OrderCreationException extends OrderException {
  constructor(message: string = 'Failed to create order') {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR);
    this.name = 'OrderCreationException';
  }
}

/**
 * Exception thrown when order is not found
 */
export class OrderNotFoundException extends OrderException {
  constructor(orderNumber?: string) {
    const message = orderNumber ? `Order ${orderNumber} not found` : 'Order not found';
    super(message, HttpStatus.NOT_FOUND);
    this.name = 'OrderNotFoundException';
  }
}

/**
 * Exception thrown when order validation fails
 */
export class OrderValidationException extends OrderException {
  constructor(message: string = 'Order validation failed') {
    super(message, HttpStatus.BAD_REQUEST);
    this.name = 'OrderValidationException';
  }
}

/**
 * Exception thrown when cart is empty
 */
export class EmptyCartException extends OrderException {
  constructor() {
    super('Cart is empty', HttpStatus.BAD_REQUEST);
    this.name = 'EmptyCartException';
  }
}

/**
 * Exception thrown when cart items validation fails
 */
export class CartItemsValidationException extends OrderException {
  constructor(message: string = 'Cart items validation failed') {
    super(message, HttpStatus.BAD_REQUEST);
    this.name = 'CartItemsValidationException';
  }
}

/**
 * Exception thrown when order update fails
 */
export class OrderUpdateException extends OrderException {
  constructor(message: string = 'Failed to update order') {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR);
    this.name = 'OrderUpdateException';
  }
}

/**
 * Exception thrown when order cannot be updated (business rule violation)
 */
export class OrderUpdateNotAllowedException extends OrderException {
  constructor(message: string = 'Order cannot be updated') {
    super(message, HttpStatus.FORBIDDEN);
    this.name = 'OrderUpdateNotAllowedException';
  }
}

/**
 * Exception thrown when payment gateway operations fail
 */
export class PaymentGatewayException extends HttpException {
  constructor(message: string = 'Payment gateway error', status: HttpStatus = HttpStatus.BAD_GATEWAY) {
    super(message, status);
    this.name = 'PaymentGatewayException';
  }
}

/**
 * Exception thrown when APG handshake fails
 */
export class ApgHandshakeException extends PaymentGatewayException {
  constructor(message: string = 'APG handshake failed') {
    super(message, HttpStatus.BAD_GATEWAY);
    this.name = 'ApgHandshakeException';
  }
}

/**
 * Exception thrown when payment transaction fails
 */
export class PaymentTransactionException extends PaymentGatewayException {
  constructor(message: string = 'Payment transaction failed') {
    super(message, HttpStatus.PAYMENT_REQUIRED);
    this.name = 'PaymentTransactionException';
  }
}

/**
 * Exception thrown when checkout process fails
 */
export class CheckoutException extends HttpException {
  constructor(message: string = 'Checkout failed', status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, status);
    this.name = 'CheckoutException';
  }
}

/**
 * Exception thrown when unsupported payment method is used
 */
export class UnsupportedPaymentMethodException extends CheckoutException {
  constructor(paymentMethod?: string) {
    const message = paymentMethod ? `Payment method '${paymentMethod}' is not supported` : 'Unsupported payment method';
    super(message, HttpStatus.BAD_REQUEST);
    this.name = 'UnsupportedPaymentMethodException';
  }
}
