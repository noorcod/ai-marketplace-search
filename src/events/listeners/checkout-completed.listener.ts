import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { EnvService } from 'src/global-modules/env/env.service';
import { CheckoutCompletedEvent } from '../dto/checkout-completed.event';

@Injectable()
export class CheckoutCompletedListener {
  private readonly logger = new Logger(CheckoutCompletedListener.name);

  constructor(
    private readonly envService: EnvService,
    private readonly httpService: HttpService,
  ) {}

  @OnEvent('checkout.completed')
  async handleCheckoutCompletedEvent(payload: CheckoutCompletedEvent) {
    try {
      const resolveProofUrl = (proof: string) => {
        if (!proof) return null;
        if (/^https?:\/\//i.test(proof)) return proof;
        return `${this.envService.s3URL}/${proof}`;
      };

      const formatMoney = (value: unknown) => {
        const n = typeof value === 'number' ? value : Number(value);
        if (!Number.isFinite(n)) return String(value ?? '0');
        return n.toFixed(2);
      };

      const itemBlocks = payload.items.flatMap(item => {
        const lines: string[] = [];
        lines.push(`*${item.listingTitle}*`);
        if (item.shopName) lines.push(`Shop: ${item.shopName}`);
        if (item.orderSourceId != null) lines.push(`Order Source ID: ${item.orderSourceId}`);
        lines.push(
          `Qty: ${item.quantity}  |  Unit: Rs. ${formatMoney(item.unitPrice)}  |  Total: Rs. ${formatMoney(
            item.totalPrice,
          )}`,
        );

        const section: any = {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: lines.join('\n'),
          },
        };

        if (item.listingUrl) {
          section.accessory = {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Product',
              emoji: true,
            },
            value: 'view_product',
            url: item.listingUrl,
            action_id: 'view_ordered_product',
          };
        }

        return [section, { type: 'divider' }];
      });

      const slackMessage = {
        text: `Checkout Completed - Order # ${payload.orderNumber}`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text:
                this.envService.nodeEnv !== 'production'
                  ? `⛔ TESTING - ${this.envService.nodeEnv.toUpperCase()} ⛔ — Checkout # ${payload.orderNumber}`
                  : `🛒 We've got a new Order — #${payload.orderNumber}`,
              emoji: true,
            },
          },
          { type: 'divider' },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Payment Method:* ${payload.paymentMethod}`,
              },
              {
                type: 'mrkdwn',
                text: `*Items Count:* ${payload.itemCount}`,
              },
              {
                type: 'mrkdwn',
                text: `*APG Payment:* ${payload.isApgPayment ? 'Yes' : 'No'}`,
              },
              {
                type: 'mrkdwn',
                text: `*Timestamp:* ${payload.timestamp.toISOString()}`,
              },
            ],
          },
          { type: 'divider' },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Order Items:*',
            },
          },
          ...itemBlocks,
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Sub Total:* Rs. ${formatMoney(payload.subTotal)}`,
              },
              {
                type: 'mrkdwn',
                text: `*Delivery Charges:* Rs. ${formatMoney(payload.deliveryCharges)}`,
              },
              {
                type: 'mrkdwn',
                text: `*Voucher Discount:* Rs. ${formatMoney(payload.voucherDiscount)}`,
              },
              {
                type: 'mrkdwn',
                text: `*Grand Total:* Rs. ${formatMoney(payload.grandTotal)}`,
              },
            ],
          },
          { type: 'divider' },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Customer:* ${payload.customerName}`,
              },
              {
                type: 'mrkdwn',
                text: `*Contact:* ${payload.customerContact}`,
              },
              {
                type: 'mrkdwn',
                text: `*Email:* ${payload.customerEmail || 'N/A'}`,
              },
              {
                type: 'mrkdwn',
                text: `*City:* ${payload.deliveryCity}`,
              },
              {
                type: 'mrkdwn',
                text: `*Address:* ${payload.deliveryAddress}`,
              },
            ],
          },
        ],
      };

      const proofUrl = payload.trxProof ? resolveProofUrl(payload.trxProof) : null;
      if (proofUrl) {
        (slackMessage.blocks as any[]).push({ type: 'divider' });
        (slackMessage.blocks as any[]).push({
          type: 'image',
          image_url: proofUrl,
          alt_text: 'Transaction Proof',
        });
      }

      await firstValueFrom(
        this.httpService.post(this.envService.SlackOrdersWebhookUrl, slackMessage).pipe(
          catchError(err => {
            this.logger.error(`Failed to send Slack notification: ${err.message}`);
            throw err;
          }),
        ),
      );

      this.logger.log(`Checkout completed event processed for order #${payload.orderNumber}`);
    } catch (error) {
      this.logger.error(`Error handling checkout completed event: ${error.message}`, error.stack);
      // Don't throw - notification failure shouldn't affect the checkout flow
    }
  }
}
