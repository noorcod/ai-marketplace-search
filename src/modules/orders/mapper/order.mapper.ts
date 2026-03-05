import { Cart } from '@modules/carts/entities/cart.entity';
import { CartItem } from '@modules/carts/entities/cart-item.entity';
import { Order } from '../entities/order.entity';
import { OrderSource } from '../entities/order-source.entity';
import { OrderItem } from '../entities/order-item.entity';
import { OrderStatus, OrderSourceStatus } from '../constants/order-status.enum';
import { randomUUID } from 'crypto';

/**
 * Maps cart data to order structure
 * Handles pricing calculations and multi-shop grouping
 */
export class OrderMapper {
  /**
   * Generate a unique order number for Delivery For You orders.
   * @return a string of 18 characters in the format TB-XXXXXXXXXXXXX-X
   */
  static generateOrderNumber(userId: string): string {
    const prefix = 'TB'; // 2 characters
    const timestamp = Date.now().toString(); // 13 digits 1747730271850
    const isRegistered = userId ? '1' : '0'; // 1 or 0

    return `${prefix}-${timestamp}-${isRegistered}`;
  }

  /**
   * Group cart items by shop for OrderSource creation
   */
  static groupItemsByShop(cartItems: CartItem[]): Map<number, CartItem[]> {
    const grouped = new Map<number, CartItem[]>();

    for (const item of cartItems) {
      const shopId = typeof item.shop === 'number' ? item.shop : (item.shop as any)?.shopId || 1;
      const items = grouped.get(shopId) || [];
      items.push(item);
      grouped.set(shopId, items);
    }

    return grouped;
  }

  /**
   * Calculate pricing for cart items
   */
  static calculatePricing(items: CartItem[]): {
    totalProductDiscount: string;
    subTotal: string;
  } {
    let totalProductDiscount = 0;
    let subTotal = 0;

    for (const item of items) {
      const unitPrice = parseFloat(item.unitPrice?.toString() || '0');
      const unitDiscount = parseFloat(item.unitDiscount?.toString() || '0');
      const qty = item.quantity || 1;

      const itemTotal = unitPrice * qty;
      const itemDiscount = unitDiscount * qty;

      totalProductDiscount += itemDiscount;
      subTotal += itemTotal - itemDiscount;
    }

    return {
      totalProductDiscount: totalProductDiscount.toFixed(2),
      subTotal: subTotal.toFixed(2),
    };
  }

  /**
   * Map cart to order entity
   */
  static mapCartToOrder(
    cart: Cart,
    pricing: { totalProductDiscount: string; subTotal: string },
    deliveryAmount: string = '0.00',
    voucherDiscount: string = '0.00',
    userId?: string | number,
  ): Partial<Order> {
    const subTotal = parseFloat(pricing.subTotal);
    const voucherDiscountNum = parseFloat(voucherDiscount);
    const deliveryAmountNum = parseFloat(deliveryAmount);
    const grandTotal = subTotal + deliveryAmountNum - voucherDiscountNum;

    const isGuest = !userId;
    const guestId = isGuest ? randomUUID() : undefined;

    return {
      orderNumber: this.generateOrderNumber(userId ? userId.toString() : ''),
      user: userId ? userId.toString() : undefined,
      isGuest: isGuest,
      guestId: guestId,
      quantity: cart.quantity || 0,
      orderAmount: subTotal.toFixed(2),
      deliveryAmount: deliveryAmount,
      productDiscount: pricing.totalProductDiscount,
      voucherDiscount: voucherDiscount,
      cummulativeDiscount: (parseFloat(pricing.totalProductDiscount) + voucherDiscountNum).toFixed(2),
      subTotal: subTotal.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
      isVoucherApplied: parseFloat(voucherDiscount) > 0,
      status: OrderStatus.PENDING,
      managedBy: 'By Techbazaar',
      isDeleted: 0,
      isDummy: false,
    };
  }

  /**
   * Map shop items to OrderSource
   */
  static mapShopItemsToOrderSource(
    shopId: number,
    location: number,
    items: CartItem[],
    orderId: number,
    voucherId?: number,
  ): Partial<OrderSource> {
    let amount = 0;
    let discountValue = 0;

    for (const item of items) {
      const unitPrice = parseFloat(item.unitPrice?.toString() || '0');
      const unitDiscount = parseFloat(item.unitDiscount?.toString() || '0');
      const qty = item.quantity || 1;

      amount += unitPrice * qty;
      discountValue += unitDiscount * qty;
    }

    return {
      order: { id: orderId } as any,
      shop: shopId,
      location: location,
      quantity: items.reduce((sum, item) => sum + (item.quantity || 1), 0),
      amount: amount.toFixed(2),
      discountValue: discountValue.toFixed(2),
      voucher: voucherId ? ({ id: voucherId } as any) : undefined,
      voucherDiscount: '0.00',
      status: OrderSourceStatus.PENDING,
      isDeleted: 0,
    };
  }

  /**
   * Map cart item to OrderItem
   */
  static mapCartItemToOrderItem(cartItem: CartItem, orderNumber: string, orderSourceId: number): Partial<OrderItem> {
    const listing = cartItem.listing;
    const item = cartItem.item;

    return {
      listing: { listingId: listing?.listingId || (listing as any)?.id || 0 } as any,
      orderSource: { id: orderSourceId } as any,
      orderNumber: orderNumber,
      productTitle: (listing?.listingTitle as string) || 'Product',
      productPrimaryImage: (listing?.primaryImage as string) || '',
      condition: (item?.condition as unknown as string) || '',
      category: (item?.category as unknown as string) || '',
      price: (cartItem.unitPrice || '0').toString(),
      discount: (cartItem.unitDiscount || '0').toString(),
      quantity: cartItem.quantity || 1,
      warranty: (item as any)?.warranty || null,
      salePrice: (cartItem.unitPrice || '0').toString(),
      minCostPrice: '0.00',
      maxCostPrice: '0.00',
      isDeleted: 0,
    };
  }
}
