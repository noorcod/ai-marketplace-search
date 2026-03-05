import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { EnvService } from 'src/global-modules/env/env.service';
import { OrderCreationService } from './services/order-creation.service';
import { ApgCardTrxResponseType } from '@common/types/apg-card-trx-response.type';
import { Order } from './entities/order.entity';
import { APG_TRANSACTION_TYPE, InitApgDto } from './dto/payments/init-apg.dto';
import { AppResponse } from '@common/responses/app-response';
import { ApgHandshakeException, PaymentTransactionException } from './exceptions/order.exceptions';
import { APG_ENCRYPTION, APG_TAX_PERCENT, APG_ENDPOINTS } from './constants/apg.constants';
import { ApgHelper } from './utils/apg.helper';
import { OrderSummary } from './types/order.types';

@Injectable()
export class ApgService {
  private readonly logger = new Logger(ApgService.name);

  constructor(
    private readonly envService: EnvService,
    private readonly orderCreationService: OrderCreationService,
    private readonly http: HttpService,
  ) {}

  async initHandShakeAndSSO(data: InitApgDto, userId: string) {
    try {
      const { transactionTypeId, ...rest } = data;
      const createResult = await this.orderCreationService.createOrderForAPG(userId, rest);
      if (!createResult.success) {
        throw new ApgHandshakeException('Failed to create order for APG');
      }

      const orderSummary = createResult.data as OrderSummary;
      if (!orderSummary) {
        throw new ApgHandshakeException('Order creation returned no result');
      }

      const trxRef = orderSummary.orderNumber;

      // Build and encrypt handshake request
      const handShakeMapString = ApgHelper.buildHandshakeMapString({
        channelId: this.envService.bafChannelId,
        isRedirectionRequest: this.envService.bafIsRedirectionRequest,
        merchantId: this.envService.bafMerchantId,
        storeId: this.envService.bafStoreId,
        returnUrl: this.envService.bafReturnUrl,
        merchantHash: this.envService.bafMerchantHash,
        merchantUsername: this.envService.bafMerchantUsername,
        merchantPassword: this.envService.bafMerchantPassword,
        trxRef,
      });
      const encryptedHandShake = this.encryptMapString(handShakeMapString);

      const hsFields = {
        HS_ChannelId: this.envService.bafChannelId,
        HS_IsRedirectionRequest: this.envService.bafIsRedirectionRequest,
        HS_ReturnURL: this.envService.bafReturnUrl,
        HS_MerchantId: this.envService.bafMerchantId,
        HS_StoreId: this.envService.bafStoreId,
        HS_MerchantHash: this.envService.bafMerchantHash,
        HS_MerchantUsername: this.envService.bafMerchantUsername,
        HS_MerchantPassword: this.envService.bafMerchantPassword,
        HS_TransactionReferenceNumber: trxRef,
        HS_RequestHash: encryptedHandShake,
      };

      // Perform handshake
      const response = await firstValueFrom(
        this.http.post(this.envService.bafHsEndpoint, new URLSearchParams(hsFields).toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json, text/plain, */*',
          },
        }),
      );

      this.logger.log('APG Handshake Response:', response?.data);

      // Extract auth token from response
      const authToken = ApgHelper.extractAuthToken(response.data);
      if (!authToken) {
        throw new ApgHandshakeException('Handshake failed - no AuthToken received');
      }

      // Validate order amount - use grandTotal from orderSummary
      const transactionAmount = parseFloat(orderSummary.totals.grandTotal);
      if (transactionAmount == null || isNaN(transactionAmount)) {
        throw new ApgHandshakeException('Order missing total amount');
      }

      // Build and encrypt SSO request
      const mapStringSSO = ApgHelper.buildSsoMapString({
        authToken,
        channelId: this.envService.bafChannelId,
        currency: this.envService.bafCurrency,
        isBIN: 0,
        returnUrl: this.envService.bafReturnUrl,
        merchantId: this.envService.bafMerchantId,
        storeId: this.envService.bafStoreId,
        merchantHash: this.envService.bafMerchantHash,
        merchantUsername: this.envService.bafMerchantUsername,
        merchantPassword: this.envService.bafMerchantPassword,
        transactionTypeId,
        trxRef,
        transactionAmount,
      });
      const RequestHash = this.encryptMapString(mapStringSSO);

      // Build SSO fields for redirect
      const ssoFields = {
        AuthToken: authToken,
        RequestHash,
        ChannelId: this.envService.bafChannelId,
        Currency: this.envService.bafCurrency,
        IsBIN: 0,
        ReturnURL: this.envService.bafReturnUrl,
        MerchantId: this.envService.bafMerchantId,
        StoreId: this.envService.bafStoreId,
        MerchantHash: this.envService.bafMerchantHash,
        MerchantUsername: this.envService.bafMerchantUsername,
        MerchantPassword: this.envService.bafMerchantPassword,
        TransactionTypeId: transactionTypeId,
        TransactionReferenceNumber: trxRef,
        TransactionAmount: transactionAmount,
      };

      return AppResponse.Ok({ apgUrl: this.envService.bafSsoEndpoint, fields: ssoFields });
    } catch (error) {
      this.logger.error(`APG Handshake failed: ${error.message}`, error.stack);

      // Re-throw known exceptions
      if (error instanceof ApgHandshakeException) {
        throw error;
      }

      // Wrap unknown errors
      throw new ApgHandshakeException(`APG handshake error: ${error.message}`);
    }
  }

  async apgTransactionStatus(trxRef: string) {
    try {
      const url = `${this.envService.bafBaseUrl}/HS/api/IPN/OrderStatus/${this.envService.bafMerchantId}/${this.envService.bafStoreId}/${trxRef}`;
      const response = await firstValueFrom(
        this.http.get(url, {
          headers: {
            Accept: 'application/json',
          },
        }),
      );
      const trxResult = JSON.parse(response.data) as ApgCardTrxResponseType;
      return AppResponse.Ok(trxResult);
    } catch (error) {
      this.logger.error(`Failed to fetch APG transaction status: ${error.message}`, error.stack);
      throw new PaymentTransactionException(`Failed to fetch transaction status for ${trxRef}`);
    }
  }

  async listenAndUpdateOrderStatusAfterTrxnCompletion(url: string) {
    try {
      // ========================================
      // SECURITY: Validate URL to prevent SSRF attacks
      // ========================================
      const orderNumberFromUrl = this.validateApgCallbackUrl(url);

      const response = await firstValueFrom(
        this.http.get(url, {
          headers: {
            Accept: 'application/json',
          },
        }),
      );
      const data = JSON.parse(response.data) as ApgCardTrxResponseType;
      this.logger.log('APG IPN Data:', data);

      // ========================================
      // SECURITY: Verify order number matches transaction data
      // ========================================
      if (!data || !data.TransactionReferenceNumber) {
        this.logger.error('[SECURITY] Invalid transaction data received from APG');
        throw new BadRequestException('Invalid transaction data');
      }

      if (data.TransactionReferenceNumber !== orderNumberFromUrl) {
        this.logger.error(
          `[SECURITY] Order number mismatch! URL: ${orderNumberFromUrl}, ` +
            `Transaction: ${data.TransactionReferenceNumber}`,
        );
        throw new BadRequestException('Order number mismatch');
      }

      // Calculate MDR and settlement amount
      const mdr = ApgHelper.getMdrRate(data.TransactionTypeId);
      const expectedSettlementAmount = ApgHelper.calculateSettlementAmount(Number(data.TransactionAmount), mdr);

      // Map transaction status
      const orderStatus = ApgHelper.mapToOrderStatus(data.TransactionStatus);
      const trx_status = ApgHelper.mapToTrxStatus(data.TransactionStatus);

      const orderNumber = data.TransactionReferenceNumber;

      const updateObject = {
        updatedAt: new Date(),
        trxTime: data.TransactionDateTime,
        trxExpectedSettlementAmount: expectedSettlementAmount,
        trxAmount: parseFloat(data.TransactionAmount).toFixed(2),
        trxId: data.TransactionId,
        trxStatus: trx_status,
        status: orderStatus,
        mdrPercent: mdr,
        taxPercent: APG_TAX_PERCENT,
      };

      const updateResult = await this.orderCreationService.updateOrderDataAfterPaymentByCard(orderNumber, updateObject);
      this.logger.log('Order update result:', updateResult);
      return updateResult;
    } catch (error) {
      this.logger.error(`Failed to process APG webhook: ${error.message}`, error.stack);
      throw new PaymentTransactionException(`Failed to process payment callback: ${error.message}`);
    }
  }

  /**
   * Convert key/IV string to Buffer with auto-detection of format
   */
  private toKeyBufferAuto(s: string, allowed: number[], label: string): Buffer {
    if (!s) {
      throw new Error('Missing key/iv value');
    }
    if (/^[0-9a-fA-F]+$/.test(s) && s.length % 2 === 0) {
      const hex = Buffer.from(s, 'hex');
      if (allowed.includes(hex.length)) return hex;
    }
    if (/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(s)) {
      const b64 = Buffer.from(s, 'base64');
      if (allowed.includes(b64.length)) return b64;
    }
    const utf8 = Buffer.from(s, 'utf8');
    if (allowed.includes(utf8.length)) return utf8;
    throw new Error(`Invalid ${label} length. Expected ${allowed.join(', ')} bytes`);
  }

  /**
   * Encrypt map string using AES-128-CBC
   */
  private encryptMapString(mapString: string): string {
    const keyBuf = this.toKeyBufferAuto(this.envService.bafKey1, [APG_ENCRYPTION.KEY_LENGTH], 'KEY1');
    const ivBuf = this.toKeyBufferAuto(this.envService.bafKey2, [APG_ENCRYPTION.IV_LENGTH], 'KEY2/IV');
    const algorithm = APG_ENCRYPTION.ALGORITHM;
    const cipher = crypto.createCipheriv(algorithm, keyBuf, ivBuf);
    let encrypted = cipher.update(mapString, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
  }

  /**
   * Validate APG callback URL to prevent SSRF attacks
   * Ensures URL matches expected format and extracts order number
   *
   * @param url - The callback URL to validate
   * @returns The extracted order number from the URL
   * @throws BadRequestException if URL is invalid
   */
  private validateApgCallbackUrl(url: string): string {
    // Escape special regex characters in base URL
    const escapedBaseUrl = this.envService.bafBaseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Build expected URL pattern
    // Format: {baseUrl}/HS/api/IPN/OrderStatus/{merchantId}/{storeId}/{orderNumber}
    const expectedPattern = new RegExp(
      `^${escapedBaseUrl}${APG_ENDPOINTS.ORDER_STATUS}/` +
        `${this.envService.bafMerchantId}/` +
        `${this.envService.bafStoreId}/` +
        `([A-Z0-9-]+)$`,
    );

    const match = url.match(expectedPattern);

    if (!match) {
      this.logger.error(
        `[SECURITY] Invalid APG callback URL format: ${url}\n` +
          `Expected pattern: ${this.envService.bafBaseUrl}${APG_ENDPOINTS.ORDER_STATUS}/` +
          `${this.envService.bafMerchantId}/${this.envService.bafStoreId}/{orderNumber}`,
      );
      throw new BadRequestException('Invalid callback URL format');
    }

    const orderNumber = match[1];
    this.logger.log(`[SECURITY] Validated APG callback URL for order: ${orderNumber}`);

    return orderNumber;
  }
}
