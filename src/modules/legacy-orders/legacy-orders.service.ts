import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';
import { LegacyOrderRepository } from './repositories/legacy-order.repository';
import { LegacyVoucherRepository } from './repositories/legacy-voucher.repository';
import { LegacyDeliveryChargesRepository } from './repositories/legacy-delivery-charges.repository';
import { QueryOptions, QueryWhere } from '@common/interfaces/repository.interface';
import { AppResponse } from '@common/responses/app-response';
import { LegacyVoucher } from './entities/legacy-voucher.entity';
import { PaginationOptions } from '@common/utilities/pagination-options';
import { LegacyOrder } from './entities/legacy-order.entity';
import { nestedObjectToDotFields } from '@common/utilities/nested-object-to-dot-fields';
import { LEGACY_ORDER_COLUMNS } from '@common/constants/column-selections.constants';
import { LEGACY_ORDER_POPULATE } from '@common/constants/populate-tables.constants';
import { OrderByOptions } from '@common/utilities/order-by-options';
import { UpdateLegacyOrderDto } from './dto/update-legacy-order.dto';
import { CreateLegacyOrderDto } from './dto/create-legacy-order.dto';
import { dateTime } from '@common/utilities/date-time';
import { SMSService } from '@common/services/sms/sms.service';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { Logger } from '@nestjs/common';
import { PaymentGatewaySessionInputType } from '@modules/legacy-orders/types/payment-gateway-session-input.type';
import { HttpService } from '@nestjs/axios';
import { EnvService } from 'src/global-modules/env/env.service';
import { OrderCreatedEvent } from 'src/events/dto/order-created.event';
import { COOLDOWN, MAX_ATTEMPTS, OrderOtpHash, OTP_EXPIRY, OTP_HASH_EXPIRY } from '@common/utilities/otp';
import { AuthService } from '@modules/auth/auth.service';
import * as moment from 'moment';
import * as _ from 'lodash';
import Redis from 'ioredis';
import { LegacyDeliveryCharges } from './entities/legacy-delivery-charges.entity';

@Injectable()
export class LegacyOrdersService {
  private redisClient: Redis | null;
  private readonly logger = new Logger(LegacyOrdersService.name);
  constructor(
    private readonly orm: MikroORM,
    private readonly em: EntityManager,
    private readonly orderRepository: LegacyOrderRepository,
    private readonly voucherRepository: LegacyVoucherRepository,
    private readonly deliveryChargesRepository: LegacyDeliveryChargesRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly smsService: SMSService,
    private readonly redisService: RedisService,
    private readonly httpService: HttpService,
    private readonly envService: EnvService,
    private readonly authService: AuthService,
  ) {
    this.redisClient = this.redisService.getOrNil();
  }

  async fetchAllDeliveryOrders(userId: string, paginationOptions: PaginationOptions, queryStrings: any) {
    const where: QueryWhere = { isDeleted: false, customer: userId, deletedAt: null };
    if (queryStrings) {
      if (queryStrings.shop) where.shop = queryStrings.shop;
      if (queryStrings.status) where.status = queryStrings.status;
      if (queryStrings.from && queryStrings.to) {
        where.createdAt = { $gte: queryStrings.from, $lte: queryStrings.to };
      }
    }
    // Build orderBy as array of [field, order] pairs
    const orderBy: [string, string | number][] = [['createdAt', 'DESC']];
    if (queryStrings?.sort) {
      const [by, order] = queryStrings.sort.split(':');
      if (by && order) orderBy.unshift([by, order.toUpperCase()]);
    }
    const legacyOrdersColumns = nestedObjectToDotFields(LEGACY_ORDER_COLUMNS);
    const legacyOrdersPopulatedTables = nestedObjectToDotFields(LEGACY_ORDER_POPULATE);
    const options: QueryOptions = {
      populate: legacyOrdersPopulatedTables,
      fields: legacyOrdersColumns,
      limit: paginationOptions.perPage,
      offset: paginationOptions.currentPage,
      orderBy: new OrderByOptions(...orderBy).getForQueryOption(),
    };
    const orders = await this.orderRepository.fetch(where, options);
    if (!orders.success || !orders.data) {
      return AppResponse.Err('No orders found') as AppResponse<Partial<LegacyOrder>[]>;
    }
    // Fetch possible filters
    const filterOptions: QueryOptions = {
      populate: ['shop'],
      fields: ['shop.shopId', 'shop.shopName'],
    };
    const filterResults = await this.orderRepository.fetch(where, filterOptions);
    if (!filterResults.success || !filterResults.data) {
      return AppResponse.Err(filterResults.message) as AppResponse<Partial<LegacyOrder>[]>;
    }
    // Remove status for count
    const countWhere = { ...where };
    delete countWhere.status;
    const statusCount = await this.orderRepository.getStatusCounts(countWhere);
    // Build all possible statuses from enum and initialize to 0
    const allStatuses = [
      'Pending',
      'Confirmed',
      'Picked',
      'Shipped',
      'Delivered',
      'Cancelled',
      'Returned',
      'Refunded',
      'Verifying Payment',
      'Payment Failed',
    ];
    const possibleFilters = {
      status: Object.fromEntries(allStatuses.map(s => [s, 0])),
      shop: [],
    };
    if (Array.isArray(statusCount)) {
      statusCount.forEach(i => {
        const statusKey = String(i.status);
        possibleFilters.status[statusKey] = Number(i.count);
      });
    }
    filterResults.data.forEach(i => {
      const shopId = i.shop?.shopId;
      const shopName = i.shop?.shopName;
      if (shopId && !possibleFilters.shop.some(j => j.shopId === shopId)) {
        possibleFilters.shop.push({ shopId, shopName });
      }
    });
    // Build response grouped by shop
    const response = [];
    orders.data.forEach(item => {
      let shopGroup = response.find(i => i.shopId === item.shop.shopId);
      const productDetail = {
        listing_title: item.productTitle,
        price: item.price,
        notes: item.notes,
        listing_url: item.listing?.url,
        discount: item.listing?.onlineDiscount,
        image: item.listing?.primaryImage,
        color: item.listing?.color,
        condition: item.listing?.conditionName,
        city: item.location?.city?.cityName,
        quantity: item.quantity,
        total_price: item.totalPrice,
        productReview: {
          review: item.reviews?.reviews,
          rating: item.reviews?.rating,
          is_pending: item.reviews?.is_pending,
        },
      };
      const deliveryDetail = {
        orderId: item?.orderId,
        orderNumber: item?.orderNumber,
        deliveryCharges: item?.deliveryCharges,
        customerName: item?.customerName,
        customerEmail: item?.customerEmail,
        customerPhone: item?.customerPhone,
        customerAddress: item?.customerAddress,
        orderDate: item?.createdAt,
        status: item?.status,
      };
      if (shopGroup) {
        shopGroup.orders.push({ productDetail, deliveryDetail });
      } else {
        response.push({
          shopId: item.shop.shopId,
          shopName: item.shop.shopName,
          orders: [{ productDetail, deliveryDetail }],
        });
      }
    });
    // Build final response structure
    const meta = orders.meta || {};
    const totalItems = meta.totalItems || response.reduce((acc, shop) => acc + shop.orders.length, 0);
    const perPage = paginationOptions.perPage;
    const currentPage = paginationOptions.currentPage;
    const totalPages = meta.totalPages || Math.ceil(totalItems / perPage);
    const paginationInfo = {
      totalItems,
      totalPages,
      currentPage,
      perPage,
      nextPage: currentPage < totalPages ? currentPage + 1 : 0,
      prevPage: currentPage > 1 ? currentPage - 1 : 0,
    };
    return {
      status: 'success',
      paginationInfo,
      data: response,
      possibleFilters,
    };
  }

  async fetchDeliveryOrderByOrderNumber(orderNumber: string) {
    const where: QueryWhere = { isDeleted: false, orderNumber: orderNumber, deletedAt: null };
    const legacyOrdersColumns = nestedObjectToDotFields(LEGACY_ORDER_COLUMNS);
    const legacyOrdersPopulatedTables = nestedObjectToDotFields(LEGACY_ORDER_POPULATE);
    const options: QueryOptions = {
      populate: legacyOrdersPopulatedTables,
      fields: legacyOrdersColumns,
    };
    const order = await this.orderRepository.fetchOne(where, options);
    if (!order.success || !order.data) {
      return AppResponse.Err('No order found') as AppResponse<Partial<LegacyOrder>[]>;
    }
    return AppResponse.fromDataLayer(order) as AppResponse<Partial<LegacyOrder>[]>;
  }

  async addDeliveryOrder(deliveryOrderObject: CreateLegacyOrderDto) {
    deliveryOrderObject.createdAt = dateTime();

    // Validate required relationships exist

    if (deliveryOrderObject.listingId) {
      const listingExists = await this.em.findOne('Listing', { listingId: deliveryOrderObject.listingId });
      if (!listingExists) {
        return AppResponse.Err(`Listing with ID ${deliveryOrderObject.listingId} does not exist`);
      }
    }

    if (deliveryOrderObject.locationId) {
      const locationExists = await this.em.findOne('Location', { locationId: deliveryOrderObject.locationId });
      if (!locationExists) {
        return AppResponse.Err(`Location with ID ${deliveryOrderObject.locationId} does not exist`);
      }
    }

    if (deliveryOrderObject.itemId) {
      const itemExists = await this.em.findOne('Items', { itemId: deliveryOrderObject.itemId });
      if (!itemExists) {
        return AppResponse.Err(`Item with ID ${deliveryOrderObject.itemId} does not exist`);
      }
    }

    // Set up entity relationships if IDs are provided
    const orderPayload: any = { ...deliveryOrderObject };

    // Convert listingId to listing reference
    if (deliveryOrderObject.listingId) {
      orderPayload.listing = this.em.getReference('Listing', deliveryOrderObject.listingId);
      delete orderPayload.listingId;
    }

    // Convert other IDs to references if needed
    if (deliveryOrderObject.customerId) {
      orderPayload.customer = this.em.getReference('MarketplaceUser', deliveryOrderObject.customerId);
      delete orderPayload.customerId;
    }

    if (deliveryOrderObject.shopId) {
      orderPayload.shop = this.em.getReference('Shop', deliveryOrderObject.shopId);
      delete orderPayload.shopId;
    }

    if (deliveryOrderObject.locationId) {
      orderPayload.location = this.em.getReference('Location', deliveryOrderObject.locationId);
      delete orderPayload.locationId;
    }

    if (deliveryOrderObject.itemId) {
      orderPayload.item = this.em.getReference('Items', deliveryOrderObject.itemId);
      delete orderPayload.itemId;
    }

    const order = await this.orderRepository.createEntity(orderPayload);
    if (!order.success) {
      return AppResponse.Err(order.message) as AppResponse<Partial<LegacyOrder>[]>;
    }
    let message: string;
    const orderData = Array.isArray(order.data) ? order.data[0] : order.data;
    if (orderData.trxMethod === 'Cash') {
      message = `Dear ${deliveryOrderObject.customerName},\n\nThank you for placing an order with us! Your order number is ${orderData.orderNumber}. You will shortly receive a confirmation call.\n\n Team Techbazaar`;
    } else {
      // In case the payment is via card or bank transfer
      message = `Dear ${deliveryOrderObject.customerName},\n\nThank you for placing an order with us! Your order number is ${orderData.orderNumber}. You will shortly receive a confirmation call. Please note that your order will be processed once the payment is confirmed.\n\n Team Techbazaar`;
    }
    let token = this.smsService.token;
    if (!token || this.smsService.isTokenExpired(token)) {
      token = await this.smsService.getToken();
    }
    const data = await this.smsService.sendSMS(
      String(deliveryOrderObject.customerPhone),
      message,
      'delivery-order',
      token,
    );
    if (data.error) {
      return AppResponse.Err(data.error);
    }
    const orderNumber = orderData.orderNumber;
    try {
      const message = {
        event: 'deliveryOrder',
        data: {
          orderNumber: orderNumber,
        },
      };
      await this.redisClient.publish('deliveryOrder', JSON.stringify(message));
    } catch (error) {
      Logger.error(`Error while publishing the newD4UOrder event: ${error}`);
    }
    // Fetch Complete Order Details
    const orderDetails = await this.fetchDeliveryOrderByOrderNumber(orderNumber);

    if (orderDetails) {
      const dataArr = Array.isArray(orderDetails.data) ? orderDetails.data : [orderDetails.data];
      const data = dataArr[0] as LegacyOrder;

      const isPotentialScamResponse = await this.orderRepository.checkIfOrderIsPotentialScam(
        data.customerPhone,
        data.orderNumber,
      );
      if (data.trxMethod === 'Cash' || data.trxMethod === 'Bank Transfer') {
        const orderEvent = new OrderCreatedEvent(
          data.orderNumber,
          data.listing.listingTitle,
          data.listing.url,
          data.shop.shopName,
          data.shop.shopAddress,
          data.shop.ownerWhatsappNumber,
          data.location.city.cityName,
          data.quantity,
          data.price,
          data.totalPrice,
          data.deliveryCharges,
          data.customerName,
          data.customerPhone,
          data.customerAddress,
          data.voucher ? 'Yes' : 'No',
          data.voucherDiscount,
          data.trxMethod,
          data.trxStatus,
          isPotentialScamResponse,
          data.trxProof ? data.trxProof : null,
        );
        this.eventEmitter.emit('order.created', orderEvent);
      } else if (data.trxMethod === 'Card') {
        // TODO: cross-check the input data to verify if the order amount is correct
        // we want to generate and send a session link to the user
        const sessionLinkInput: PaymentGatewaySessionInputType = {
          currency: 'PKR',
          cardSave: false,
          operation: 'PURCHASE',
          language: 'EN',
          clientTransactionId: data.orderNumber,
          description: `Order Number: ${data.orderNumber} for Amount: ${data.totalPrice}`,
          amount: Number(data.totalPrice),
          callbackUrl: `${this.envService.marketplaceDashboardUrl}order-confirmation?on=${data.orderNumber}&utm-source="abhipay"`,
        };
        const sessionLink = await this.generateSessionLink(sessionLinkInput);
        if (sessionLink) {
          return sessionLink;
        }
        return AppResponse.Ok({
          url: sessionLink,
          result: order,
        });
      }
    }
    return AppResponse.Ok({ message: 'Order added successfully', result: order });
  }

  async updateOrderData(orderNumber: string, updateOrderObj: UpdateLegacyOrderDto) {
    const where: QueryWhere = { isDeleted: false, orderNumber: orderNumber, deletedAt: null };
    const order = await this.orderRepository.fetchOne(where);
    if (!order.success || !order.data) {
      return AppResponse.Err('No order found') as AppResponse<Partial<LegacyOrder>[]>;
    }
    const orderData = order.data as LegacyOrder;
    if (
      orderData.status !== 'Pending' ||
      orderData.trxMethod !== 'Card' ||
      (orderData.trxStatus !== 'PENDING' && orderData.trxStatus !== 'CREATED')
    ) {
      return AppResponse.Err(
        'Order cannot be updated. Only orders with status Pending and payment method Card can be updated',
      );
    }
    // Check if anything is actually updated
    const newOrder = { ...orderData, ...updateOrderObj };
    // Use lodash for deep comparison, omitting updatedAt
    const nothingUpdated = _.isEqual(_.omit(orderData, ['updatedAt']), _.omit(newOrder, ['updatedAt']));
    if (nothingUpdated) {
      return AppResponse.OkWithMessage('No changes detected', orderData) as AppResponse<Partial<LegacyOrder>>;
    }
    const updatedOrder = await this.orderRepository.updateEntity(where, updateOrderObj as Partial<LegacyOrder>);
    if (!updatedOrder.success) {
      return AppResponse.Err('Failed to update order') as AppResponse<Partial<LegacyOrder>[]>;
    }
    // Fetch updated order details
    const orderDetails = await this.fetchDeliveryOrderByOrderNumber(orderNumber);
    if (orderDetails && orderDetails.data) {
      const dataArr = Array.isArray(orderDetails.data) ? orderDetails.data : [orderDetails.data];
      const data = dataArr[0] as LegacyOrder;
      if (data && data.trxMethod === 'Card' && data.status !== 'Payment Failed') {
        // You may want to define a custom event class for order updates
        this.eventEmitter.emit('order.updated', {
          orderNumber: data.orderNumber,
          productTitle: data.productTitle,
          shopName: data.shop?.shopName,
          shopAddress: data.shop?.shopAddress,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerAddress: data.customerAddress,
          trxMethod: data.trxMethod,
          trxStatus: data.trxStatus,
          status: data.status,
        });
      }
    }
    return AppResponse.fromDataLayer(updatedOrder) as AppResponse<Partial<LegacyOrder>[]>;
  }

  async fetchAllDeliveryCharges(paginationOptions: PaginationOptions) {
    const where: QueryWhere = { isDeleted: false };
    const options: QueryOptions = { limit: paginationOptions.perPage, offset: paginationOptions.currentPage };
    const deliveryCharges = await this.deliveryChargesRepository.fetch(where, options);
    if (!deliveryCharges.success || !deliveryCharges.data) {
      return AppResponse.Err('No delivery charges found') as AppResponse<Partial<LegacyDeliveryCharges>[]>;
    }
    return AppResponse.fromDataLayer(deliveryCharges) as AppResponse<Partial<LegacyDeliveryCharges>[]>;
  }

  async fetchVoucherDetails(voucherCode: string) {
    const where: QueryWhere = { isDeleted: false, voucherCode: voucherCode };
    const voucher = await this.voucherRepository.fetchOne(where);
    if (!voucher.success || !voucher.data) {
      return AppResponse.Err('No voucher found') as AppResponse<Partial<LegacyVoucher>[]>;
    }
    const vouchers = voucher.data as LegacyVoucher;
    const expiry = vouchers.expiryDate;
    const currTime = moment().utcOffset(300);
    if (!expiry || currTime.isAfter(expiry)) {
      return AppResponse.Err('Voucher invalid or is no longer available') as AppResponse<Partial<LegacyVoucher>[]>;
    }

    return AppResponse.fromDataLayer(voucher) as AppResponse<Partial<LegacyVoucher>[]>;
  }

  async sendOtpToUser(phoneNumber: string, req: Request) {
    // Check if the user is logged in
    const authHeader = req.headers['authorization'];

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Extract the token part (remove "Bearer " prefix)
      const userToken = authHeader.substring(7);

      try {
        const phoneNumberCheck = await this.authService.checkUserPhoneNumberStatus(userToken, phoneNumber);
        if (phoneNumberCheck && phoneNumberCheck.success) {
          if (phoneNumberCheck.data?.['verified']) {
            return AppResponse.Err('Phone number already verified');
          }
        }
        // If phone number check returns an error (like invalid token), log it but continue
        if (phoneNumberCheck && !phoneNumberCheck.success) {
          Logger.log('Phone number check failed:', phoneNumberCheck.message);
        }
      } catch (error) {
        Logger.log('Error checking phone number status:', error);
        // Continue with OTP sending even if user validation fails
      }
    } else {
      Logger.warn('No Bearer token found, continuing as guest user');
    }

    const key = `tmp:order:otp:${phoneNumber}`;
    const now = this.getUtcNowUnix();
    let otp: string;
    // we check if an otp was already sent to the user's contact number
    const raw = await this.redisClient.hgetall(key);
    if (Object.keys(raw).length > 0) {
      const otpHash = this.parseOtpHash(raw);
      // if the otp is still valid, we do not send a new one
      if (otpHash.lastGeneratedAt && now - parseInt(otpHash.lastGeneratedAt) < COOLDOWN) {
        return AppResponse.Err('Otp already sent');
      }

      // we check attempts to avoid misuse
      if (otpHash.attempts && otpHash.attempts >= MAX_ATTEMPTS) {
        return AppResponse.Err('Maximum attempts reached');
      }

      // if the otp is expired, we generate a new one
      otp = Math.floor(100000 + Math.random() * 900000).toString();

      // we update the otp hash
      await this.redisClient.hmset(
        key,
        'otp',
        otp,
        'lastGeneratedAt',
        now.toString(),
        'attempts',
        (otpHash.attempts + 1).toString(),
        'expiryTime',
        (now + OTP_EXPIRY).toString(),
      );
    } else {
      // if no otp was sent, we generate a new one
      otp = Math.floor(100000 + Math.random() * 900000).toString();

      // we create a new otp hash
      await this.redisClient.hmset(
        key,
        'otp',
        otp,
        'lastGeneratedAt',
        now.toString(),
        'attempts',
        '1',
        'expiryTime',
        (now + OTP_EXPIRY).toString(),
      );

      // we set the expiry time to 1 hour
      await this.redisClient.expire(key, OTP_HASH_EXPIRY);
    }

    // Send the OTP to the user's contact number
    const message = `Your verification code for Processing order at Techbazaar is ${otp}`;

    // Check if SMS token is expired and get new one if needed
    let token = this.smsService.token;

    if (!token || this.smsService.isTokenExpired(token)) {
      try {
        token = await this.smsService.getToken();
      } catch (error) {
        return AppResponse.Err('Failed to get SMS authentication token');
      }
    }

    if (!token) {
      return AppResponse.Err('SMS service unavailable - no authentication token');
    }

    const data = await this.smsService.sendSMS(String(phoneNumber), message, 'order-otp', token);
    if (data.error) {
      return AppResponse.Err(data.error);
    }

    return AppResponse.Ok({ message: 'Otp sent successfully' });
  }

  async verifyUserMobile(phoneNumber: string, otp: string, req: Request) {
    const key = `tmp:order:otp:${phoneNumber}`;
    const raw = await this.redisClient.hgetall(key);
    if (Object.keys(raw).length === 0) {
      return AppResponse.Err('No otp found');
    }
    const data = this.parseOtpHash(raw);
    const now = this.getUtcNowUnix();
    if (now > parseInt(data.expiryTime)) {
      return AppResponse.Err('Otp expired');
    }
    if (data.otp !== otp) {
      return AppResponse.Err('Invalid otp');
    } else {
      await this.redisClient.del(key);

      // Check if the user is logged in
      const authHeader = req.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // Extract the token part (remove "Bearer " prefix)
        const token = authHeader.substring(7);

        try {
          // Verify if the user is logged in using google and doesn't have a phone number or their phone number is not verified
          const updateResponse = await this.authService.updateUserPhoneNumber(token, phoneNumber);
          if (updateResponse) {
            return updateResponse;
          }
        } catch (error) {
          Logger.error('Error updating phone number:', error);
          return AppResponse.Err('Error updating phone number');
        }
      }

      return AppResponse.Ok({ message: 'Otp verified successfully' });
    }
  }

  private parseOtpHash(data: Record<string, string>): OrderOtpHash {
    return {
      otp: data.otp,
      lastGeneratedAt: data.lastGeneratedAt,
      attempts: parseInt(data.attempts),
      expiryTime: data.expiryTime,
    };
  }

  private getUtcNowUnix(): number {
    return moment().utc().unix();
  }

  private async generateSessionLink(data: PaymentGatewaySessionInputType) {
    try {
      let response = await this.httpService.axiosRef.post(`https://api.abhipay.com.pk/api/v3/orders`, data, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `A1118C511C504ABCB0425457CF50DE6C`,
        },
      });
      if (response.status === 200) {
        return response.data.payload?.['paymentUrl'];
      } else {
        return AppResponse.Err('Unable to generate session link');
      }
    } catch (e) {
      Logger.error(e);
      return AppResponse.Err(`Unable to generate session link: ${e}`);
    }
  }
}
