export enum LegacyOrderStatus {
  PENDING = 'Pending',
  VERIFYING_PAYMENT = 'Verifying Payment',
  CONFIRMED = 'Confirmed',
  PICKED = 'Picked',
  SHIPPED = 'Shipped',
  DELIVERED = 'Delivered',
  RETURNED = 'Returned',
  CANCELLED = 'Cancelled',
  REFUNDED = 'Refunded',
  PAYMENT_FAILED = 'Payment Failed',
}

export enum LegacyOrderOrderHandledBy {
  SUPPORT = 'Support',
  SHOP = 'Shop',
  DELIVERY_PARTNER = 'Delivery Partner',
}

export enum LegacyOrderTrxMethod {
  CASH = 'Cash',
  CARD = 'Card',
  BANK_TRANSFER = 'Bank Transfer',
}

export enum LegacyOrderTrxStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  SETTLED = 'SETTLED',
  SETTLE_PENDING = 'SETTLE_PENDING',
  DECLINED = 'DECLINED',
  CREATED = 'CREATED',
  EXPIRED = 'EXPIRED',
}

export enum LegacyOrderTrxRefundStatus {
  NA = 'NA',
  PENDING = 'PENDING',
  SETTLED = 'SETTLED',
}
export enum DiscountUnit {
  FIXED = 'fixed',
  PERCENTAGE = 'percentage',
}
