import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { AppResponse } from '@common/responses/app-response';
import { QueryOptions, QueryWhere } from '@common/interfaces/repository.interface';
import { nestedObjectToDotFields } from '@common/utilities/nested-object-to-dot-fields';
import { OrderRepository } from './repositories/order.repository';
import { OrderPaymentRepository } from './repositories/order-payment.repository';
import { OrderTrackingRepository } from './repositories/order-tracking.repository';
import { Order } from './entities/order.entity';
import { OrderPayment } from './entities/order-payment.entity';
import { OrderTracking } from './entities/order-tracking.entity';
import { CreateOrderDto } from './dto/orders/create-order.dto';
import { CheckoutItemDto } from './dto/checkout/checkout-item.dto';
import { ORDER_POPULATE } from '@common/constants/populate-tables.constants';
import { OrderValidationService } from './services/order-validation.service';
import { OrderCreationService } from './services/order-creation.service';
import { OrderStatus, ALL_ORDER_STATUSES } from './constants/order-status.enum';
import { TrxStatus } from './dto/payments/order-payment.dto';
import { ApgUpdateOrderType } from '@common/types/apg-update-order.type';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UpdateOrderDto } from './dto/orders/update-order.dto';
import { OrderByOptions } from '@common/utilities/order-by-options';
import { PaginationOptions } from '@common/utilities/pagination-options';
import { calculateOrderStatus } from './utils/order-status-calculator.util';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly orderPaymentRepository: OrderPaymentRepository,
    private readonly orderTrackingRepository: OrderTrackingRepository,
    private readonly orderValidationService: OrderValidationService,
    private readonly orderCreationService: OrderCreationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Validate cart items before order creation
   */
  async validateCartItems(items: CheckoutItemDto[]): Promise<AppResponse<any>> {
    return this.orderValidationService.validateCartItems(items);
  }

  /**
   * Create order from user's cart - delegates to OrderCreationService
   */
  async createOrder(userId: string, createOrder: CreateOrderDto): Promise<AppResponse<any>> {
    return this.orderCreationService.createOrder(userId, createOrder);
  }

  async getOrderById(userId: string, orderId: number): Promise<AppResponse<any>> {
    try {
      const where: QueryWhere<Order> = {
        id: orderId,
        user: userId,
        isDeleted: 0,
      };

      const orderPopulatedTables = nestedObjectToDotFields(ORDER_POPULATE);
      const options: QueryOptions<Order> = {
        populate: orderPopulatedTables,
      };

      const result = await this.orderRepository.fetchOne(where, options);

      if (!result.success || !result.data) {
        return AppResponse.Err('Order not found', HttpStatus.NOT_FOUND);
      }

      // Fetch payment and tracking info
      const order = result.data as Order;
      const paymentWhere: QueryWhere<OrderPayment> = { order: orderId };
      const trackingWhere: QueryWhere<OrderTracking> = { order: orderId };

      const [paymentResult, trackingResult] = await Promise.all([
        this.orderPaymentRepository.fetchOne(paymentWhere),
        this.orderTrackingRepository.fetchOne(trackingWhere),
      ]);

      // Transform orderSources to be grouped by shop
      const sourcesRaw: any[] = Array.isArray((order as any).orderSources)
        ? (order as any).orderSources
        : (order as any).orderSources && typeof (order as any).orderSources.getItems === 'function'
          ? (order as any).orderSources.getItems()
          : [];

      const grouped = new Map<string | number, any>();

      for (const src of sourcesRaw) {
        const shopObj = src?.shop ?? null;
        const shopId = shopObj ? (shopObj.id ?? shopObj.shopId ?? null) : null;

        const itemsRaw: any[] = Array.isArray(src.orderItems)
          ? src.orderItems
          : src.orderItems && typeof src.orderItems.getItems === 'function'
            ? src.orderItems.getItems()
            : [];

        const key = shopId ?? `shop_${src.id}`;

        if (!grouped.has(key)) {
          grouped.set(key, {
            shop: shopObj,
            shopId: shopId,
            orderItems: [],
            quantity: 0,
            amount: 0,
            discountValue: 0,
            voucherDiscount: 0,
            orderSources: [],
          });
        }

        const entry = grouped.get(key);

        // append items
        for (const it of itemsRaw) {
          entry.orderItems.push(it);
          entry.quantity += Number(it.quantity || 0);
          entry.amount += Number(it.price || 0) * Number(it.quantity || 0);
        }

        // accumulate source-level numeric fields if present
        entry.discountValue += Number(src.discountValue || 0);
        entry.voucherDiscount += Number(src.voucherDiscount || 0);
        entry.orderSources.push(src);
      }

      const groupedOrderSources = Array.from(grouped.values()).map(g => ({
        shop: g.shop,
        shopId: g.shopId,
        orderItems: g.orderItems,
        quantity: g.quantity,
        amount: Number(g.amount).toFixed(2),
        discountValue: Number(g.discountValue).toFixed(2),
        voucherDiscount: Number(g.voucherDiscount).toFixed(2),
        orderSources: g.orderSources,
      }));

      // Calculate actual status based on order_sources (display only, doesn't update DB)
      const calculatedStatus = calculateOrderStatus(sourcesRaw);

      const responseData = {
        ...order,
        status: calculatedStatus, // Show calculated status to user
        orderSources: groupedOrderSources,
        payment: paymentResult.data || null,
        tracking: trackingResult.data || null,
      };

      return AppResponse.Ok(responseData);
    } catch (e) {
      this.logger.error(`Error getting order: ${e.message}`, e.stack);
      return AppResponse.Err(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async createOrderForAPG(userId: string, deliveryOrderObject: CreateOrderDto) {
    return this.orderCreationService.createOrderForAPG(userId, deliveryOrderObject);
  }

  async updateOrderDataAfterPaymentByCard(orderNumber: string, updateOrderData: ApgUpdateOrderType) {
    return this.orderCreationService.updateOrderDataAfterPaymentByCard(orderNumber, updateOrderData);
  }

  async fetchDeliveryOrderByOrderNumber(orderNumber: string): Promise<AppResponse<Partial<Order>>> {
    const where: QueryWhere<Order> = {
      isDeleted: 0,
      orderNumber: orderNumber,
      deletedAt: null,
      isSpam: false,
      isDummy: false,
    };

    // Keep this endpoint lean: avoid returning full user/shop/listing graphs.
    const ORDER_DETAILS_POPULATE = {
      user: true,
      orderPayment: true,
      deliveryAddresses: true,
      orderSources: {
        shop: true,
        location: {
          city: true,
        },
        orderItems: {
          listing: true,
        },
      },
    };

    const ORDER_DETAILS_FIELDS = {
      id: true,
      orderNumber: true,
      isGuest: true,
      status: true,
      orderAmount: true,
      quantity: true,
      deliveryAmount: true,
      productDiscount: true,
      voucherDiscount: true,
      cummulativeDiscount: true,
      subTotal: true,
      grandTotal: true,
      managedBy: true,
      eta: true,
      createdAt: true,
      updatedAt: true,

      user: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
      },

      orderPayment: {
        id: true,
        amountReceivable: true,
        amountReceived: true,
        trxMethod: true,
        trxTime: true,
        trxId: true,
        trxAmount: true,
        trxStatus: true,
      },

      deliveryAddresses: {
        id: true,
        name: true,
        email: true,
        contact: true,
        alternativeNumber: true,
        streetAddress: true,
        city: true,
        province: true,
        country: true,
        nearLandmark: true,
        createdAt: true,
        updatedAt: true,
      },

      orderSources: {
        id: true,
        status: true,
        quantity: true,
        amount: true,
        discountValue: true,
        voucherDiscount: true,
        trackingId: true,
        createdAt: true,
        updatedAt: true,

        shop: {
          shopId: true,
          shopName: true,
          username: true,
          logoPath: true,
        },

        location: {
          locationId: true,
          address: true,
          locationNick: true,
          latitude: true,
          longitude: true,
          city: {
            cityId: true,
            cityName: true,
          },
        },

        orderItems: {
          id: true,
          productTitle: true,
          productPrimaryImage: true,
          condition: true,
          category: true,
          price: true,
          discount: true,
          quantity: true,
          warranty: true,
          terms: true,
          salePrice: true,
          createdAt: true,
          updatedAt: true,

          listing: {
            listingId: true,
            listingTitle: true,
            url: true,
            primaryImage: true,
            effectivePrice: true,
            effectiveDiscount: true,
            conditionName: true,
            brandName: true,
            modelTitle: true,
            colorName: true,
            currencyCode: true,
          },
        },
      },
    };

    const options: QueryOptions<Order> = {
      populate: nestedObjectToDotFields(ORDER_DETAILS_POPULATE),
      fields: nestedObjectToDotFields(ORDER_DETAILS_FIELDS),
    };
    const order = await this.orderRepository.fetchOne(where, options);
    if (!order.success || !order.data) {
      return AppResponse.Err('No order found') as AppResponse<Partial<Order>>;
    }

    const data = Array.isArray(order.data) ? (order.data as any[])[0] : order.data;

    // Calculate actual status based on order_sources (display only, doesn't update DB)
    const orderSources = (data as any)?.orderSources;
    if (orderSources) {
      const sources = Array.isArray(orderSources)
        ? orderSources
        : typeof orderSources.getItems === 'function'
          ? orderSources.getItems()
          : [];
      (data as any).status = calculateOrderStatus(sources);
    }

    return AppResponse.Ok(data as Partial<Order>);
  }

  async fetchAllDeliveryOrders(userId: string, paginationOptions: PaginationOptions, queryStrings: any) {
    try {
      const where: any = { isDeleted: false, user: userId, deletedAt: null };
      if (queryStrings) {
        if (queryStrings.status) where.status = queryStrings.status;
        if (queryStrings.from && queryStrings.to) {
          where.createdAt = { $gte: queryStrings.from, $lte: queryStrings.to };
        }
      }

      // Build orderBy
      const orderBy: [string, string | number][] = [['createdAt', 'DESC']];
      if (queryStrings?.sort) {
        const [by, order] = String(queryStrings.sort).split(':');
        if (by && order) orderBy.unshift([by, order.toUpperCase()]);
      }

      // const ordersColumns = nestedObjectToDotFields(ORDER_COLUMNS);
      const ordersPopulated = nestedObjectToDotFields(ORDER_POPULATE);

      const options: any = {
        populate: ordersPopulated,
        // fields: ordersColumns,
        limit: paginationOptions.limit(),
        offset: paginationOptions.offset(),
        orderBy: new OrderByOptions(...orderBy).getForQueryOption(),
      };

      const orders = await this.orderRepository.fetch(where, options);
      if (!orders.success || !orders.data) {
        return AppResponse.Err('No orders found', HttpStatus.NOT_FOUND) as any;
      }

      // Build possible filters: statuses and shops
      const countWhere = { ...where };
      delete countWhere.status;
      const statusCount = await this.orderRepository.getStatusCounts(countWhere);

      const possibleFilters: any = {
        status: Object.fromEntries(ALL_ORDER_STATUSES.map(s => [s, 0])),
        shop: [],
      };

      if (Array.isArray(statusCount)) {
        statusCount.forEach(i => {
          const statusKey = String(i.status);
          possibleFilters.status[statusKey] = Number(i.count);
        });
      }

      const unwrapCollection = (value: any): any[] => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        if (typeof value.getItems === 'function') return value.getItems();
        return [];
      };

      // collect unique shops from fetched orders
      const shopMap = new Map<number, any>();
      const response: any[] = [];

      for (const ordRaw of orders.data as any[]) {
        const ord = Array.isArray(ordRaw) ? ordRaw[0] : ordRaw;
        if (!ord) continue;

        const sources = unwrapCollection((ord as any).orderSources);
        const deliveryAddress = unwrapCollection((ord as any).deliveryAddresses)[0] ?? null;

        // Calculate actual status based on order_sources (display only, doesn't update DB)
        const calculatedStatus = calculateOrderStatus(sources);

        const orderGroup: any = {
          orderId: ord?.id,
          orderNumber: ord?.orderNumber,
          status: calculatedStatus, // Show calculated status to user
          orderDate: ord?.createdAt,
          deliveryCharges: ord?.deliveryAmount,
          customerEmail: ord?.user?.email ?? null,
          customerPhone: ord?.user?.phoneNumber ?? null,
          customerAddress: deliveryAddress,
          shops: [],
        };

        const shopsById = new Map<number | string, any>();

        for (const src of sources) {
          const shop = src?.shop ?? null;
          const shopId = shop?.shopId ?? shop?.id ?? null;
          const shopKey = shopId ?? `shop_${src?.id}`;

          if (shopId && !shopMap.has(shopId)) {
            shopMap.set(shopId, { shopId, shopName: shop?.shopName });
            possibleFilters.shop.push({ shopId, shopName: shop?.shopName });
          }

          if (!shopsById.has(shopKey)) {
            shopsById.set(shopKey, {
              shopId,
              shopName: shop?.shopName ?? null,
              items: [],
            });
          }

          const items = unwrapCollection(src?.orderItems);
          const shopEntry = shopsById.get(shopKey);

          for (const it of items) {
            shopEntry.items.push({
              listing_title: it.productTitle,
              price: it.price,
              notes: it.terms || null,
              listing_url: it.listing?.url,
              discount: it.discount,
              image: it.productPrimaryImage || it.listing?.primaryImage,
              color: it.listing?.color,
              condition: it.condition,
              city: src?.location?.city?.cityName ?? null,
              quantity: it.quantity,
              total_price: (Number(it.price || 0) * Number(it.quantity || 0)).toFixed(2),
              productReview: {
                review: it.listingId?.reviews?.reviews ?? it.listing?.reviews?.reviews ?? null,
                rating: it.listingId?.reviews?.rating ?? it.listing?.reviews?.rating ?? null,
                is_pending: it.listingId?.reviews?.is_pending ?? it.listing?.reviews?.is_pending ?? null,
              },
            });
          }
        }

        orderGroup.shops = Array.from(shopsById.values());
        response.push(orderGroup);
      }

      // Build pagination info
      const meta = (orders as any).meta || {};
      const totalItems = meta.totalItems || response.length;
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

      return AppResponse.Ok({
        paginationInfo,
        data: response,
        possibleFilters,
      });
    } catch (e) {
      this.logger.error(`Error fetching delivery orders: ${e.message}`, e.stack);
      return AppResponse.Err(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateOrderData(orderNumber: string, updateOrderObj: UpdateOrderDto | ApgUpdateOrderType) {
    const where: QueryWhere = { isDeleted: false, orderNumber: orderNumber, deletedAt: null };
    const order = await this.fetchDeliveryOrderByOrderNumber(orderNumber);
    if (!order.success || !order.data) {
      return AppResponse.Err('No order found') as AppResponse<Partial<Order>[]>;
    }
    const orderData = order.data as Order;

    const paymentResult = await this.orderPaymentRepository.fetchOne({ order: orderData.id });
    const trxMethod =
      paymentResult.success && paymentResult.data ? (paymentResult.data as OrderPayment).trxMethod : null;
    const trxStatus =
      paymentResult.success && paymentResult.data ? (paymentResult.data as OrderPayment).trxStatus : null;

    if (
      orderData.status !== OrderStatus.PENDING ||
      trxMethod !== 'Card' ||
      (trxStatus !== TrxStatus.PENDING && trxStatus !== TrxStatus.CREATED)
    ) {
      return AppResponse.Err(
        'Order cannot be updated. Only orders with status Pending and payment method Card can be updated',
      );
    }

    // Check if anything is actually updated (only compare provided fields)
    const nothingUpdated = Object.entries(updateOrderObj as unknown as Record<string, unknown>).every(
      ([key, value]) => {
        if (key === 'updatedAt' || key === 'orderNumber') return true;
        return (orderData as any)[key] === value;
      },
    );

    if (nothingUpdated) {
      return AppResponse.OkWithMessage('No changes detected', orderData) as AppResponse<Partial<Order>>;
    }

    const updatedOrder = await this.orderPaymentRepository.updateEntity(where, updateOrderObj as Partial<OrderPayment>);
    if (!updatedOrder.success) {
      return AppResponse.Err('Failed to update order') as AppResponse<Partial<Order>[]>;
    }
    const orderDetails = await this.fetchDeliveryOrderByOrderNumber(orderNumber);
    if (orderDetails && orderDetails.data) {
      const dataArr = Array.isArray(orderDetails.data) ? orderDetails.data : [orderDetails.data];
      const data = dataArr[0] as Order;

      const updatedPaymentResult = await this.orderPaymentRepository.fetchOne({
        order: (data as any).id ?? orderData.id,
      });
      const updatedTrxMethod =
        updatedPaymentResult.success && updatedPaymentResult.data
          ? (updatedPaymentResult.data as OrderPayment).trxMethod
          : null;
      const updatedTrxStatus =
        updatedPaymentResult.success && updatedPaymentResult.data
          ? (updatedPaymentResult.data as OrderPayment).trxStatus
          : null;

      if (data && updatedTrxMethod === 'Card' && data.status !== 'Payment Failed') {
        // You may want to define a custom event class for order updates
        this.eventEmitter.emit('order.updated', {
          orderNumber: data.orderNumber,
          productTitle: (data as any).productTitle,
          shopName: (data as any).shop?.shopName,
          shopAddress: (data as any).shop?.shopAddress,
          customerName: (data as any).customerName,
          customerPhone: (data as any).customerPhone,
          customerAddress: (data as any).customerAddress,
          trxMethod: updatedTrxMethod,
          trxStatus: updatedTrxStatus,
          status: data.status,
        });
      }
    }
    return AppResponse.fromDataLayer(updatedOrder) as AppResponse<Partial<Order>[]>;
  }
}
