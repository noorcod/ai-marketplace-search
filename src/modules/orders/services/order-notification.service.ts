import { Injectable, Logger } from '@nestjs/common';
import { SMSService } from '@common/services/sms/sms.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderCreatedEvent } from 'src/events/dto/order-created.event';
import Redis from 'ioredis';
import { Order } from '../entities/order.entity';

export enum OrderNotificationType {
  PAYMENT_APPROVED = 'PAYMENT_APPROVED',
  PAYMENT_DECLINED = 'PAYMENT_DECLINED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  ORDER_CREATED = 'ORDER_CREATED',
}

/**
 * Service responsible for sending notifications related to orders
 * Handles SMS, Redis events, and event emitter notifications
 */
@Injectable()
export class OrderNotificationService {
  private redisClient: Redis | null;
  private readonly logger = new Logger(OrderNotificationService.name);

  constructor(
    private readonly smsService: SMSService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Send order notification based on type
   */
  async sendOrderNotification(
    orderNumber: string,
    customerName: string,
    customerPhone: string,
    notificationType: OrderNotificationType,
  ): Promise<void> {
    try {
      const message = this.buildNotificationMessage(orderNumber, customerName, notificationType);
      await this.sendSMS(customerPhone, message);
      await this.publishRedisEvent(orderNumber);
    } catch (error) {
      this.logger.error(`Failed to send order notification: ${error.message}`, error.stack);
      // Don't throw - notification failure shouldn't break order flow
    }
  }

  /**
   * Send order created event
   */
  async sendOrderCreatedEvent(order: Order): Promise<void> {
    try {
      this.eventEmitter.emit(
        'order.created',
        new OrderCreatedEvent(
          order.orderNumber,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
        ),
      );
    } catch (error) {
      this.logger.error(`Failed to emit order created event: ${error.message}`, error.stack);
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSMS(phoneNumber: string, message: string): Promise<void> {
    try {
      let token = this.smsService.token;
      if (!token || this.smsService.isTokenExpired(token)) {
        token = await this.smsService.getToken();
      }

      const smsRes = await this.smsService.sendSMS(String(phoneNumber), message, 'delivery-order', token);
      if (smsRes.error) {
        this.logger.error(`SMS sending failed: ${smsRes.error}`);
      } else {
        this.logger.log(`SMS sent successfully to ${phoneNumber}`);
      }
    } catch (error) {
      this.logger.error(`Error sending SMS: ${error.message}`, error.stack);
    }
  }

  /**
   * Publish Redis event for order
   */
  private async publishRedisEvent(orderNumber: string): Promise<void> {
    if (!this.redisClient) {
      this.logger.warn('Redis client not initialized, skipping event publish');
      return;
    }

    try {
      const eventMessage = {
        event: 'deliveryOrder',
        data: { orderNumber },
      };
      await this.redisClient.publish('deliveryOrder', JSON.stringify(eventMessage));
      this.logger.log(`Redis event published for order ${orderNumber}`);
    } catch (error) {
      this.logger.error(`Error publishing Redis event: ${error.message}`, error.stack);
    }
  }

  /**
   * Build notification message based on type
   */
  private buildNotificationMessage(
    orderNumber: string,
    customerName: string,
    notificationType: OrderNotificationType,
  ): string {
    const messages = {
      [OrderNotificationType.PAYMENT_APPROVED]: `Dear ${customerName},\n\nThank you for placing an order with us! Your order number is ${orderNumber}. We are verifying your payment. You will shortly receive a confirmation call regarding your order.\n\n Team Techbazaar`,
      [OrderNotificationType.PAYMENT_DECLINED]: `Dear ${customerName},\n\nWe regret to inform you that the payment for your order number ${orderNumber} has been declined. Please try placing your order again or use a different payment method. If you have any questions, feel free to contact our support team.\n\n Team Techbazaar`,
      [OrderNotificationType.PAYMENT_PENDING]: `Dear ${customerName},\n\nThank you for placing an order with us! Your order number is ${orderNumber}. You will shortly receive a confirmation call. Please note that your order will be processed once the payment is confirmed.\n\n Team Techbazaar`,
      [OrderNotificationType.ORDER_CREATED]: `Dear ${customerName},\n\nThank you for placing an order with us! Your order number is ${orderNumber}. You will shortly receive a confirmation call.\n\n Team Techbazaar`,
    };

    return messages[notificationType] || messages[OrderNotificationType.ORDER_CREATED];
  }

  /**
   * Set Redis client (for dependency injection)
   */
  setRedisClient(client: Redis): void {
    this.redisClient = client;
  }
}
