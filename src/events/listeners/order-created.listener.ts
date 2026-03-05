import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { EnvService } from 'src/global-modules/env/env.service';
import { OrderCreatedEvent } from '../dto/order-created.event';

@Injectable()
export class OrderCreatedListener {
  private readonly logger = new Logger(OrderCreatedListener.name);

  constructor(
    private readonly envService: EnvService,
    private readonly httpService: HttpService,
  ) {}

  @OnEvent('order.created')
  async handleOrderCreatedEvent(payload: OrderCreatedEvent) {
    let slackMessage: any = {
      text: `New Order Received for ${payload.listingTitle}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text:
              this.envService.nodeEnv !== 'production'
                ? `⛔ TESTING - ${this.envService.nodeEnv.toUpperCase()} ENVIRONMENT ⛔ — (${payload.orderNumber})`
                : `🎉 We've got a new Order — (${payload.orderNumber})`,
            emoji: true,
          },
        },
        { type: 'divider' },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${payload.listingTitle}*`,
          },
          accessory: {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Product',
              emoji: true,
            },
            value: 'view_product',
            url: payload.listingURL,
            action_id: 'view_ordered_product',
          },
        },
        { type: 'divider' },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Shop Name:* ${payload.shopName}`,
            },
            {
              type: 'mrkdwn',
              text: `*Shop Address:* ${payload.shopAddress}`,
            },
            {
              type: 'mrkdwn',
              text: `*Shop Contact:* ${payload.shopContact}`,
            },
            {
              type: 'mrkdwn',
              text: `*City:* ${payload.city}`,
            },
          ],
        },
        { type: 'divider' },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Quantity:* ${payload.qty}`,
            },
            {
              type: 'mrkdwn',
              text: `*Price:* ${payload.price}`,
            },
            {
              type: 'mrkdwn',
              text: `*Delivery Charges:* ${payload.deliveryCharges}`,
            },
            {
              type: 'mrkdwn',
              text: `*Total Price:* ${payload.totalPrice}`,
            },
            {
              type: 'mrkdwn',
              text: `*Applied Voucher:* ${payload.appliedVoucher}`,
            },
            {
              type: 'mrkdwn',
              text: `*Voucher Discount:* ${payload.voucherDiscount}`,
            },
            {
              type: 'mrkdwn',
              text: `*Transaction Method:* ${payload.trxMethod}`,
            },
            {
              type: 'mrkdwn',
              text: `*Transaction Status:* ${payload.trxStatus}`,
            },
          ],
        },
        { type: 'divider' },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Customer Name:* ${payload.customerName}`,
            },
            {
              type: 'mrkdwn',
              text: `*Customer Contact:* ${payload.customerContact}`,
            },
            {
              type: 'mrkdwn',
              text: `*Customer Address:* ${payload.customerAddress}`,
            },
          ],
        },
      ],
    };

    if (payload.isPotentialScam) {
      slackMessage.blocks.splice(1, 0, {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `⚠️ *Potential Scam Detected!*`,
          },
        ],
      });
    }

    if (payload.trxProof) {
      slackMessage.blocks.push({
        type: 'image',
        image_url: `${this.envService.s3URL}/${payload.trxProof}`,
        alt_text: 'Transaction Proof',
      });
    }

    if (!this.envService.SlackOrdersWebhookUrl) {
      this.logger.warn('SLACK_ORDERS_WEBHOOK_URL is not configured; skipping Slack notification');
      return;
    }

    try {
      await firstValueFrom(this.httpService.post(this.envService.SlackOrdersWebhookUrl, { ...slackMessage }));
    } catch (err) {
      this.logger.error('Failed to send Slack order notification', err as any);
    }
  }
}
