import { OrderStatus, OrderSourceStatus } from '../constants/order-status.enum';
import { OrderSource } from '../entities/order-source.entity';

/**
 * Calculate the aggregate order status based on all order source statuses
 * This is used for display purposes only - does not update the database
 *
 * The other project (admin/shop dashboard) is responsible for updating
 * the database order.status when they update order_source.status
 */
export function calculateOrderStatus(orderSources: OrderSource[] | any[]): OrderStatus {
  if (!orderSources || orderSources.length === 0) {
    return OrderStatus.PENDING;
  }

  const statuses = orderSources.map(s => s.status as string);

  // All payment failed
  if (statuses.every(s => s === OrderSourceStatus.PAYMENT_FAILED)) {
    return OrderStatus.PAYMENT_FAILED;
  }

  // Any verifying payment
  if (statuses.some(s => s === OrderSourceStatus.VERIFYING_PAYMENT)) {
    return OrderStatus.VERIFYING_PAYMENT;
  }

  // All cancelled
  if (statuses.every(s => s === OrderSourceStatus.CANCELLED)) {
    return OrderStatus.CANCELLED;
  }

  // All delivered
  if (statuses.every(s => s === OrderSourceStatus.DELIVERED)) {
    return OrderStatus.COMPLETED;
  }

  // Some delivered, some not (excluding cancelled)
  if (
    statuses.some(s => s === OrderSourceStatus.DELIVERED) &&
    statuses.some(s => ![OrderSourceStatus.DELIVERED, OrderSourceStatus.CANCELLED].includes(s as OrderSourceStatus))
  ) {
    return OrderStatus.PARTIALLY_FULFILLED;
  }

  // Any in progress (Confirmed/Picked/Shipped)
  if (
    statuses.some(s =>
      [OrderSourceStatus.CONFIRMED, OrderSourceStatus.PICKED, OrderSourceStatus.SHIPPED].includes(
        s as OrderSourceStatus,
      ),
    )
  ) {
    return OrderStatus.IN_PROGRESS;
  }

  // All pending (or default)
  return OrderStatus.PENDING;
}

/**
 * Helper to unwrap MikroORM Collection or array
 */
export function unwrapOrderSources(orderSources: any): OrderSource[] {
  if (!orderSources) return [];
  if (Array.isArray(orderSources)) return orderSources;
  if (typeof orderSources.getItems === 'function') return orderSources.getItems();
  return [];
}
