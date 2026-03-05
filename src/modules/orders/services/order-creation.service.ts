import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';
import { AppResponse } from '@common/responses/app-response';
import { CreateOrderDto } from '../dto/orders/create-order.dto';
import { CartItemsValidationException } from '../exceptions/order.exceptions';
import { OrderRepository } from '../repositories/order.repository';
import { CartService } from '@modules/carts/cart.service';
import { Order } from '../entities/order.entity';
import { OrderSource } from '../entities/order-source.entity';
import { OrderItem } from '../entities/order-item.entity';
import { OrderPayment } from '../entities/order-payment.entity';
import { OrderTracking } from '../entities/order-tracking.entity';
import { OrderDeliveryAddress } from '../entities/order-delivery-address.entity';
import { OrderMapper } from '../mapper/order.mapper';
import { CartItem } from '@modules/carts/entities/cart-item.entity';
import { ShippingService } from '../shipping.service';
import { VouchersService } from '../vouchers.service';
import { OrderValidationService } from './order-validation.service';
import { OrderNotificationService, OrderNotificationType } from './order-notification.service';
import { OrderStatus } from '../constants/order-status.enum';
import {
  DEFAULT_DECIMAL,
  DEFAULT_MDR_PERCENT,
  DEFAULT_TAX_PERCENT,
  DEFAULT_PLATFORM_CHARGES,
  TrxStatus,
  isApgPaymentMethod,
} from '../constants/order-defaults.constants';
import { OrderSummary } from '../types/order.types';
import { dateTime } from '@common/utilities/date-time';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApgUpdateOrderType } from '@common/types/apg-update-order.type';
import { MarketplaceUser } from '@modules/users/entities/marketplace-user.entity';
import { CheckoutCompletedEvent, CheckoutItemSummary } from 'src/events/dto/checkout-completed.event';
import { City } from '@modules/lookups/entities/city.entity';

/**
 * Service responsible for order creation and payment-related updates
 * Extracted from OrdersService to reduce coupling with payment gateways
 */
@Injectable()
export class OrderCreationService {
  private readonly logger = new Logger(OrderCreationService.name);

  constructor(
    private readonly orm: MikroORM,
    private readonly em: EntityManager,
    private readonly orderRepository: OrderRepository,
    private readonly cartService: CartService,
    private readonly shippingService: ShippingService,
    private readonly vouchersService: VouchersService,
    private readonly orderValidationService: OrderValidationService,
    private readonly orderNotificationService: OrderNotificationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create order for APG payment gateway
   */
  async createOrderForAPG(userId: string, deliveryOrderObject: CreateOrderDto): Promise<AppResponse<OrderSummary>> {
    deliveryOrderObject.created_at = dateTime();
    return this.createOrder(userId, deliveryOrderObject);
  }

  /**
   * Create order with validation and processing.
   * Uses database transaction to ensure atomicity.
   * Note: DTO validation already ensures cartItems is a non-empty array.
   */
  async createOrder(userId: string, createOrder: CreateOrderDto): Promise<AppResponse<OrderSummary>> {
    const cartItems = createOrder.cartItems;

    // ========================================
    // LAYER 1: VALIDATION (Read-only)
    // ========================================
    const validationResult = await this.orderValidationService.validateCartItems(cartItems);
    if (!validationResult.success) {
      const errorMessage =
        typeof validationResult.message === 'string' ? validationResult.message : 'Cart items validation failed';
      this.logger.error(`Cart validation failed: ${errorMessage}`);
      return AppResponse.Err(errorMessage, HttpStatus.BAD_REQUEST);
    }

    const validationData = validationResult.data as {
      valid: boolean;
      issues: any[];
      itemCount: number;
      listingsMap: Map<number, any>;
    };
    const { valid, issues, listingsMap } = validationData;
    if (!valid) {
      const errorMsg = `Validation failed: ${issues.map((i: any) => i.message).join(', ')}`;
      this.logger.error(errorMsg);
      throw new CartItemsValidationException(errorMsg);
    }

    // ========================================
    // LAYER 1.5: PRICE VALIDATION (Security - uses existing listingsMap)
    // ========================================
    const priceValidation = this.orderValidationService.validateCartItemPrices(cartItems, listingsMap);
    if (!priceValidation.success) {
      this.logger.error(`[SECURITY] Price validation failed: ${priceValidation.message}`);
      return AppResponse.Err(priceValidation.message, HttpStatus.BAD_REQUEST);
    }

    // ========================================
    // LAYER 2: PRICING CALCULATION (Pure computation)
    // ========================================
    const pricing = OrderMapper.calculatePricing(cartItems as unknown as CartItem[]);

    // ========================================
    // LAYER 2.5: LOOKUP CITY ID & USER EMAIL (Read-only)
    // ========================================
    let deliveryCityId: number | undefined = undefined;
    const cityNameOrId = createOrder?.deliveryAddress?.city;

    if (cityNameOrId) {
      const parsedCityId = Number(cityNameOrId);
      if (!isNaN(parsedCityId) && Number.isInteger(parsedCityId)) {
        deliveryCityId = parsedCityId;
      } else {
        const cityResult = await this.em.findOne(City, { cityName: cityNameOrId, isDeleted: false });
        if (cityResult) {
          deliveryCityId = cityResult.cityId;
        } else {
          this.logger.warn(`City not found: ${cityNameOrId}`);
        }
      }
    }

    // Fetch user email if not provided (moved outside transaction for performance)
    let deliveryEmail: string | null = (createOrder as any)?.deliveryAddress?.email ?? null;
    if (!deliveryEmail && userId) {
      const user = await this.em.findOne(MarketplaceUser, { id: userId }, { fields: ['email'] as any });
      deliveryEmail = user?.email ?? null;
    }

    // ========================================
    // LAYER 3: EXTERNAL CALCULATIONS (Read-only, parallel)
    // ========================================
    const voucherPromise: Promise<AppResponse<any>> = createOrder.voucherId
      ? this.vouchersService.applyVoucherToOrder(createOrder.voucherId, {
          userId,
          cartItems: cartItems as any,
          listingsMap: listingsMap,
          orderAmount: Number(pricing.subTotal),
          deliveryChargeAmount: 0,
          deliveryCityId: deliveryCityId,
          paymentMethod: createOrder.paymentDetails.trxMethod,
        })
      : Promise.resolve(AppResponse.Err('No voucher applied', HttpStatus.BAD_REQUEST));

    const shippingPromise = this.shippingService.calculateShipping({
      cartItems: cartItems as any,
      destinationCityId: deliveryCityId,
    });

    // Execute in parallel
    const [deliveryChargesResult, voucherResult] = await Promise.all([shippingPromise, voucherPromise]);

    // ========================================
    // LAYER 4: PROCESS CALCULATION RESULTS
    // ========================================
    let deliveryChargeAmount = 0;
    const deliveryChargesByListingId = new Map<number, number>();

    if (deliveryChargesResult.success && deliveryChargesResult.data) {
      const shippingData = deliveryChargesResult.data as any;
      deliveryChargeAmount = shippingData.totalShippingCharges || 0;

      // Extract per-item delivery charges from shipping response
      if (shippingData.shops && Array.isArray(shippingData.shops)) {
        for (const shop of shippingData.shops) {
          if (shop.categories && Array.isArray(shop.categories)) {
            for (const category of shop.categories) {
              if (category.items && Array.isArray(category.items)) {
                for (const item of category.items) {
                  deliveryChargesByListingId.set(item.listingId, item.shippingCharge || 0);
                }
              }
            }
          }
        }
      }
    } else {
      this.logger.warn(`Shipping calculation failed: ${deliveryChargesResult.message}`);
    }

    // Process voucher discount
    let voucherDiscount = 0;
    let appliedVoucherId: number | null = null;

    if (voucherResult.success && voucherResult.data) {
      const voucherData = voucherResult.data as any;
      voucherDiscount = voucherData.discountAmount || 0;
      appliedVoucherId = createOrder.voucherId || null;
    } else if (createOrder.voucherId) {
      // If voucher ID was provided but failed to apply, block order creation
      const errorMsg = voucherResult.message || 'Voucher validation failed';
      this.logger.error(`Voucher ${createOrder.voucherId} could not be applied: ${errorMsg}`);
      return AppResponse.Err(`Unable to apply voucher: ${errorMsg}`, HttpStatus.BAD_REQUEST);
    }

    // ========================================
    // LAYER 4.5: PLATFORM FEE & TOTAL VALIDATION (Security)
    // ========================================
    const paymentMethod = createOrder.paymentDetails.trxMethod;

    // Calculate expected platform fee and grand total
    const orderTotalsCalc = this.orderValidationService.calculateOrderTotals(
      Number(pricing.subTotal),
      deliveryChargeAmount,
      voucherDiscount,
      paymentMethod,
    );

    // Validate platform fee if provided (for APG methods)
    const platformFeeValidation = this.orderValidationService.validatePlatformFee(
      createOrder.paymentDetails.platformCharges,
      orderTotalsCalc,
      paymentMethod,
    );
    if (!platformFeeValidation.success) {
      this.logger.error(`[SECURITY] Platform fee validation failed: ${platformFeeValidation.message}`);
      return AppResponse.Err(platformFeeValidation.message, HttpStatus.BAD_REQUEST);
    }

    // Validate total amount if provided
    if (createOrder.paymentDetails.amountReceivable) {
      const totalValidation = this.orderValidationService.validateTotalAmount(
        createOrder.paymentDetails.amountReceivable,
        orderTotalsCalc,
        paymentMethod,
        Number(pricing.subTotal),
        deliveryChargeAmount,
        voucherDiscount,
      );
      if (!totalValidation.success) {
        this.logger.error(`[SECURITY] Total amount validation failed: ${totalValidation.message}`);
        return AppResponse.Err(totalValidation.message, HttpStatus.BAD_REQUEST);
      }
    }

    // Use backend-calculated total (authoritative source)
    const finalAmountReceivable = orderTotalsCalc.grandTotal;
    const finalPlatformCharges = orderTotalsCalc.platformFee;

    this.logger.log(
      `Order totals calculated - Subtotal: ${pricing.subTotal}, ` +
        `Delivery: ${deliveryChargeAmount}, Voucher: ${voucherDiscount}, ` +
        `Platform Fee: ${finalPlatformCharges}, Grand Total: ${finalAmountReceivable}`,
    );

    // ========================================
    // LAYER 5: PREPARE ORDER DATA
    // ========================================
    const deliveryAmountStr = String(deliveryChargeAmount.toFixed(2));
    const voucherDiscountStr = String(voucherDiscount.toFixed(2));

    // Create order entity using mapper for consistency
    const orderData = OrderMapper.mapCartToOrder(
      { quantity: cartItems.reduce((acc, it) => acc + (Number((it as any).quantity) || 0), 0) } as any,
      pricing,
      deliveryAmountStr,
      voucherDiscountStr,
      userId,
    );

    // Add voucher relation if applied
    if (appliedVoucherId) {
      (orderData as any).voucher = { id: appliedVoucherId };
    }

    // Override createdAt if provided
    if (createOrder.created_at) {
      (orderData as any).createdAt = createOrder.created_at;
    }

    // ========================================
    // LAYER 6: DATABASE TRANSACTION
    // ========================================
    return this.orm.em
      .transactional(async em => {
        try {
          const order = em.create(Order, orderData as any);

          // Use backend-calculated amounts (not frontend values)
          const amountReceivableStr = finalAmountReceivable.toFixed(2);
          const platformChargesStr = finalPlatformCharges.toFixed(2);

          const orderPayment = em.create(OrderPayment, {
            order,
            amountReceivable: amountReceivableStr,
            amountReceived: null,
            trxMethod: createOrder.paymentDetails.trxMethod,
            trxTime: dateTime(),
            trxAmount: amountReceivableStr,
            mdr_percent: DEFAULT_MDR_PERCENT,
            taxPercent: DEFAULT_TAX_PERCENT,
            platformCharges: platformChargesStr,
          } as any);

          const orderDeliveryAddress = em.create(OrderDeliveryAddress, {
            order,
            name: createOrder.deliveryAddress.name,
            email: deliveryEmail,
            contact: createOrder.deliveryAddress.contact,
            alternativeNumber: (createOrder as any)?.deliveryAddress?.alternativeNumber ?? null,
            streetAddress: createOrder.deliveryAddress.streetAddress,
            city: createOrder.deliveryAddress.city,
            province: (createOrder as any)?.deliveryAddress?.province ?? '',
            country: (createOrder as any)?.deliveryAddress?.country ?? '',
            nearLandmark: (createOrder as any)?.deliveryAddress?.nearLandmark ?? '',
          } as any);

          const orderTracking = em.create(OrderTracking, {
            order,
            status: OrderStatus.PENDING,
            createdAt: dateTime(),
          } as any);

          const orderItemsSummary: Array<{
            listingId: number;
            shopId: number;
            locationId?: number;
            quantity: number;
            unitPrice: string;
            title: string;
            primaryImage: string;
            listingUrl?: string | null;
            shopName?: string;
          }> = [];

          const sourcesByShopAndLocation = new Map<
            string,
            {
              shopId: number;
              locationId?: number;
              items: Array<{ item: any; listing: any }>;
            }
          >();

          // listingsMap already available from validation above (includes listingPrice relation)

          for (const item of cartItems) {
            const listing = listingsMap.get(item.listingId) as any;
            if (!listing) {
              throw new CartItemsValidationException(`Listing ${item.listingId} not found`);
            }

            const shopId = Number(listing?.shop?.shopId ?? item.shopId);
            const locationId = listing?.location?.locationId ? Number(listing.location.locationId) : undefined;
            const key = `${shopId}:${locationId ?? 'null'}`;

            if (!sourcesByShopAndLocation.has(key)) {
              sourcesByShopAndLocation.set(key, {
                shopId,
                locationId,
                items: [],
              });
            }

            const group = sourcesByShopAndLocation.get(key)!;
            group.items.push({ item, listing });

            orderItemsSummary.push({
              listingId: Number(item.listingId),
              shopId,
              locationId,
              quantity: Number(item.quantity),
              unitPrice: item.unitPrice.toFixed(2),
              title: String(listing.listingTitle ?? ''),
              primaryImage: String(listing.primaryImage ?? ''),
              listingUrl: (listing as any)?.url ?? null,
              shopName: String((listing as any)?.shop?.shopName ?? ''),
            });
          }

          for (const group of sourcesByShopAndLocation.values()) {
            const totalQuantity = group.items.reduce((acc, { item }) => acc + Number(item.quantity || 0), 0);
            const totalAmount = group.items.reduce(
              (acc, { item }) => acc + Number(item.quantity || 0) * Number(item.unitPrice || 0),
              0,
            );
            const totalDiscount = group.items.reduce((acc, { item, listing }) => {
              const qty = Number(item.quantity || 0);
              const discount = Number(listing.effectiveDiscount || 0);
              return acc + qty * discount;
            }, 0);

            // Calculate total delivery charges for this order source
            const totalDeliveryCharges = group.items.reduce((acc, { item }) => {
              const deliveryCharge = deliveryChargesByListingId.get(item.listingId) || 0;
              return acc + deliveryCharge * Number(item.quantity || 0);
            }, 0);

            const orderSource = em.create(OrderSource, {
              order,
              shop: group.shopId,
              location: group.locationId,
              quantity: totalQuantity,
              amount: totalAmount.toFixed(2),
              discountValue: totalDiscount.toFixed(2),
              deliveryCharges: totalDeliveryCharges.toFixed(2),
            } as any);

            for (const { item, listing } of group.items) {
              // Extract cost price data from listingPrice relation (already populated)
              const listingPrice = listing.listingPrice;
              const onlinePrice = listingPrice?.onlinePrice || item.unitPrice;
              const minCost = listingPrice?.minCostPrice || DEFAULT_DECIMAL;
              const maxCost = listingPrice?.maxCostPrice || DEFAULT_DECIMAL;

              // Get delivery charge for this specific item
              const itemDeliveryCharge = deliveryChargesByListingId.get(item.listingId) || 0;
              const totalItemDeliveryCharge = itemDeliveryCharge * Number(item.quantity || 0);

              em.create(OrderItem, {
                listing: item.listingId,
                orderSource,
                quantity: item.quantity,
                productTitle: listing.listingTitle,
                productPrimaryImage: listing.primaryImage || '',
                condition: listing.conditionName || '',
                category: listing.categoryName || '',
                price: item.unitPrice.toFixed(2),
                discount: listing.effectiveDiscount || DEFAULT_DECIMAL,
                orderNumber: order.orderNumber,
                salePrice: String(onlinePrice),
                minCostPrice: String(minCost),
                maxCostPrice: String(maxCost),
                deliveryCharges: totalItemDeliveryCharge.toFixed(2),
              } as any);
            }
          }

          await em.flush();
          this.logger.log(`Order created successfully: ${order.orderNumber}`);

          // Build order summary (returned from transaction)
          const orderSummary: OrderSummary = {
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            quantity: order.quantity,
            totals: {
              subTotal: order.subTotal,
              deliveryAmount: order.deliveryAmount,
              voucherDiscount: order.voucherDiscount,
              grandTotal: order.grandTotal,
            },
            payment: {
              method: (orderPayment as any).trxMethod,
              amountReceivable: (orderPayment as any).amountReceivable,
            },
            deliveryAddress: {
              name: orderDeliveryAddress.name,
              email: orderDeliveryAddress.email ?? null,
              contact: orderDeliveryAddress.contact,
              alternativeNumber: (orderDeliveryAddress as any).alternativeNumber ?? null,
              streetAddress: (orderDeliveryAddress as any).streetAddress,
              city: (orderDeliveryAddress as any).city,
              province: (orderDeliveryAddress as any).province,
              country: (orderDeliveryAddress as any).country,
              nearLandmark: (orderDeliveryAddress as any).nearLandmark,
            },
            items: orderItemsSummary,
            _internal: { order, orderPayment, orderDeliveryAddress, orderItemsSummary },
          };

          return orderSummary;
        } catch (e) {
          this.logger.error(`Order creation transaction failed: ${e.message}`, e.stack);
          return { success: false, error: e.message } as any;
        }
      })
      .then(async result => {
        // Check if transaction failed
        if (result && 'success' in result && !result.success) {
          return AppResponse.Err(result.error, HttpStatus.INTERNAL_SERVER_ERROR);
        }

        const orderSummary = result as OrderSummary;

        // ========================================
        // LAYER 7: POST-TRANSACTION OPERATIONS
        // ========================================
        try {
          if (userId) {
            const purchasedListingIds = cartItems
              .map(it => Number((it as any).listingId))
              .filter((id: number) => Number.isFinite(id) && id > 0);

            await this.cartService.removeItemsByListingIds(userId, purchasedListingIds);
          }

          const orderPayment = orderSummary._internal.orderPayment;
          const isApg = isApgPaymentMethod(orderPayment?.trxMethod);

          // Notifications + checkout-completed event only for non-APG (cash-based) payments
          if (!isApg) {
            const customerName = orderSummary.deliveryAddress?.name ?? 'Customer';
            const customerPhone = orderSummary.deliveryAddress?.contact ?? '';
            if (customerPhone) {
              await this.orderNotificationService.sendOrderNotification(
                orderSummary.orderNumber,
                customerName,
                customerPhone,
                OrderNotificationType.ORDER_CREATED,
              );
            }

            this.emitCheckoutCompletedEvent(
              orderSummary._internal.order,
              orderSummary._internal.orderPayment,
              orderSummary._internal.orderDeliveryAddress,
              orderSummary._internal.orderItemsSummary,
              false,
            );
          }
        } catch (error) {
          this.logger.error(`Post-transaction operations failed: ${error.message}`, error.stack);
        }

        return AppResponse.Ok(orderSummary);
      });
  }

  /**
   * Update order data after payment by card (APG callback)
   */
  async updateOrderDataAfterPaymentByCard(
    orderNumber: string,
    updateOrderData: ApgUpdateOrderType,
  ): Promise<AppResponse<any>> {
    try {
      // Fetch existing order with items for event emission
      const orderResult = await this.orderRepository.fetchOne({
        where: { orderNumber } as any,
        populate: [
          'orderPayment',
          'deliveryAddresses',
          'orderSources.shop',
          'orderSources.location',
          'orderSources.orderItems.listing',
        ] as any,
      });

      if (!orderResult.success || !orderResult.data) {
        return AppResponse.Err(`Order ${orderNumber} not found`, HttpStatus.NOT_FOUND);
      }

      const order = orderResult.data as Order;

      // Capture previous payment status for idempotency checks
      const payment = order.orderPayment as OrderPayment;
      const previousTrxStatus = payment.trxStatus;

      // Validate order can be updated (must be pending and APG payment method)
      if (order.status !== OrderStatus.PENDING || !isApgPaymentMethod(payment?.trxMethod)) {
        this.logger.warn(`Order cannot be updated. Status: ${order.status}, TrxMethod: ${payment?.trxMethod}`);
        return AppResponse.Err(
          'Order cannot be updated. Only orders with status Pending and APG payment methods can be updated',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Map update payload to entities (order + payment)
      order.status = updateOrderData.status as OrderStatus;
      order.updatedAt = updateOrderData.updatedAt;

      payment.trxTime = new Date(updateOrderData.trxTime) as any;
      payment.trxId = updateOrderData.trxId;
      payment.trxAmount = updateOrderData.trxAmount;
      payment.trxStatus = updateOrderData.trxStatus;
      payment.mdr_percent = String(updateOrderData.mdrPercent) as any;
      payment.taxPercent = String(updateOrderData.taxPercent) as any;
      payment.updatedAt = updateOrderData.updatedAt;

      // Update all order_source statuses to match order status
      const orderSources = order.orderSources as any;
      const sources = Array.isArray(orderSources)
        ? orderSources
        : typeof orderSources?.getItems === 'function'
          ? orderSources.getItems()
          : [];

      for (const source of sources) {
        source.status = updateOrderData.status as any; // Will be 'Verifying Payment' or 'Payment Failed'
      }

      await this.em.flush();

      // Resolve primary delivery address from collection (handles Collection or array)
      const rawDeliveryAddresses: any = order.deliveryAddresses as any;
      const resolvedDeliveryAddress = Array.isArray(rawDeliveryAddresses)
        ? rawDeliveryAddresses[0]
        : typeof rawDeliveryAddresses?.getItems === 'function'
          ? rawDeliveryAddresses.getItems()[0]
          : rawDeliveryAddresses;

      const notificationType = this.getNotificationType(updateOrderData.trxStatus);
      await this.orderNotificationService.sendOrderNotification(
        orderNumber,
        resolvedDeliveryAddress?.name || 'Customer',
        resolvedDeliveryAddress?.contact || '',
        notificationType,
      );

      // Emit checkout completed event for approved APG payments only if status changed
      if (updateOrderData.trxStatus === TrxStatus.APPROVED) {
        if (previousTrxStatus !== TrxStatus.APPROVED) {
          this.emitCheckoutCompletedEventForApg(order);
        } else {
          this.logger.log(`Order #${order.orderNumber} already approved, skipping duplicate Slack notification`);
        }
      }

      return AppResponse.Ok({ message: 'Order updated successfully', order });
    } catch (error) {
      this.logger.error(`Error updating order: ${error.message}`, error.stack);
      return AppResponse.Err(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get notification type based on transaction status
   */
  private getNotificationType(trxStatus: string): OrderNotificationType {
    switch (trxStatus) {
      case TrxStatus.APPROVED:
        return OrderNotificationType.PAYMENT_APPROVED;
      case TrxStatus.DECLINED:
        return OrderNotificationType.PAYMENT_DECLINED;
      default:
        return OrderNotificationType.PAYMENT_PENDING;
    }
  }

  /**
   * Emit checkout completed event
   */
  private emitCheckoutCompletedEvent(
    order: Order,
    orderPayment: OrderPayment,
    orderDeliveryAddress: OrderDeliveryAddress,
    orderItemsSummary: Array<{
      listingId: number;
      shopId: number;
      locationId?: number;
      quantity: number;
      unitPrice: string;
      title: string;
      primaryImage: string;
      listingUrl?: string | null;
      shopName?: string;
    }>,
    isApgPayment: boolean,
  ): void {
    const checkoutItems: CheckoutItemSummary[] = orderItemsSummary.map(item => ({
      listingId: item.listingId,
      listingTitle: item.title,
      listingUrl: item.listingUrl ?? null,
      shopName: item.shopName ?? '',
      orderSourceId: null,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unitPrice),
      totalPrice: item.quantity * parseFloat(item.unitPrice),
    }));

    this.emitCheckoutCompletedCore({
      orderNumber: order.orderNumber,
      paymentMethod: (orderPayment as any).trxMethod,
      itemCount: orderItemsSummary.length,
      subTotal: parseFloat(order.subTotal),
      deliveryAmount: parseFloat(order.deliveryAmount),
      voucherDiscount: parseFloat(order.voucherDiscount),
      grandTotal: parseFloat(order.grandTotal),
      customerName: orderDeliveryAddress.name,
      customerContact: orderDeliveryAddress.contact,
      customerEmail: orderDeliveryAddress.email,
      deliveryCity: String((orderDeliveryAddress as any).city ?? ''),
      deliveryAddress: (orderDeliveryAddress as any).streetAddress ?? '',
      items: checkoutItems,
      trxProof: (orderPayment as any)?.trxProof ?? null,
      isApgPayment,
    });
  }

  /**
   * Emit checkout completed event for APG payments (from populated order entity)
   */
  private emitCheckoutCompletedEventForApg(order: any): void {
    try {
      // Build items from order sources
      const checkoutItems: CheckoutItemSummary[] = [];
      const orderSources = order.orderSources?.getItems?.() || order.orderSources || [];

      for (const source of orderSources) {
        const orderItems = source.orderItems?.getItems?.() || source.orderItems || [];

        const orderSourceId = typeof source?.id === 'number' ? source.id : Number(source?.id) || null;

        for (const item of orderItems) {
          checkoutItems.push({
            listingId: item.listing?.id || item.listing,
            listingTitle: item.productTitle || '',
            listingUrl: item.listing?.url ?? null,
            shopName: source?.shop?.shopName ?? '',
            orderSourceId,
            quantity: item.quantity,
            unitPrice: parseFloat(item.price || '0'),
            totalPrice: item.quantity * parseFloat(item.price || '0'),
          });
        }
      }

      const deliveryAddress = order.deliveryAddresses;

      this.emitCheckoutCompletedCore({
        orderNumber: order.orderNumber,
        paymentMethod: order.orderPayment?.trxMethod || 'Card',
        itemCount: checkoutItems.length,
        subTotal: parseFloat(order.subTotal || '0'),
        deliveryAmount: parseFloat(order.deliveryAmount || '0'),
        voucherDiscount: parseFloat(order.voucherDiscount || '0'),
        grandTotal: parseFloat(order.grandTotal || '0'),
        customerName: deliveryAddress?.name || '',
        customerContact: deliveryAddress?.contact || '',
        customerEmail: deliveryAddress?.email || null,
        deliveryCity: String(deliveryAddress?.city ?? ''),
        deliveryAddress: deliveryAddress?.streetAddress || '',
        items: checkoutItems,
        trxProof: order.orderPayment?.trxProof ?? null,
        isApgPayment: true,
      });
    } catch (error) {
      this.logger.error(`Failed to build checkout completed payload (APG): ${error.message}`, error.stack);
      // Don't throw - event emission failure shouldn't break order flow
    }
  }

  /**
   * Core emitter for checkout.completed events, shared by cash & APG flows
   */
  private emitCheckoutCompletedCore(payload: {
    orderNumber: string;
    paymentMethod: string;
    itemCount: number;
    subTotal: number;
    deliveryAmount: number;
    voucherDiscount: number;
    grandTotal: number;
    customerName: string;
    customerContact: string;
    customerEmail: string | null;
    deliveryCity: string;
    deliveryAddress: string;
    items: CheckoutItemSummary[];
    trxProof: string | null;
    isApgPayment: boolean;
  }): void {
    try {
      const {
        orderNumber,
        paymentMethod,
        itemCount,
        subTotal,
        deliveryAmount,
        voucherDiscount,
        grandTotal,
        customerName,
        customerContact,
        customerEmail,
        deliveryCity,
        deliveryAddress,
        items,
        trxProof,
        isApgPayment,
      } = payload;

      this.eventEmitter.emit(
        'checkout.completed',
        new CheckoutCompletedEvent(
          orderNumber,
          paymentMethod,
          itemCount,
          subTotal,
          deliveryAmount,
          voucherDiscount,
          grandTotal,
          customerName,
          customerContact,
          customerEmail,
          deliveryCity,
          deliveryAddress,
          items,
          trxProof,
          isApgPayment,
        ),
      );

      this.logger.log(
        `Checkout completed event emitted for order #${orderNumber} (isApgPayment=${isApgPayment ? 'true' : 'false'})`,
      );
    } catch (error) {
      this.logger.error(`Failed to emit checkout completed event: ${error.message}`, error.stack);
      // Don't throw - event emission failure shouldn't break order flow
    }
  }
}
