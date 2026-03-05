/**
 * Order-related type definitions
 */

/**
 * Summary of an order item
 */
export interface OrderItemSummary {
  listingId: number;
  shopId: number;
  locationId?: number;
  quantity: number;
  unitPrice: string;
  title: string;
  primaryImage: string;
}

/**
 * Order totals breakdown
 */
export interface OrderTotals {
  subTotal: string;
  deliveryAmount: string;
  voucherDiscount: string;
  grandTotal: string;
}

/**
 * Order payment summary
 */
export interface OrderPaymentSummary {
  method: string;
  amountReceivable: string;
}

/**
 * Delivery address details
 */
export interface DeliveryAddressSummary {
  name: string;
  email: string | null;
  contact: string;
  alternativeNumber: string | null;
  streetAddress: string;
  city: string;
  province: string;
  country: string;
  nearLandmark: string;
}

/**
 * Order summary returned after successful order creation
 */
export interface OrderSummary {
  id: number;
  orderNumber: string;
  status: string;
  quantity: number;
  totals: OrderTotals;
  payment: OrderPaymentSummary;
  deliveryAddress: DeliveryAddressSummary;
  items: OrderItemSummary[];
  _internal?: any; // Used internally, stripped before returning
}
