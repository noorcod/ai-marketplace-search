/**
 * Event emitted when a checkout is successfully completed
 * Used by orders module for the new checkout flow
 */
export class CheckoutCompletedEvent {
  constructor(
    public readonly orderNumber: string,
    public readonly paymentMethod: string,
    public readonly itemCount: number,
    public readonly subTotal: number,
    public readonly deliveryCharges: number,
    public readonly voucherDiscount: number,
    public readonly grandTotal: number,
    public readonly customerName: string,
    public readonly customerContact: string,
    public readonly customerEmail: string | null,
    public readonly deliveryCity: string,
    public readonly deliveryAddress: string,
    public readonly items: CheckoutItemSummary[],
    public readonly trxProof: string | null = null,
    public readonly isApgPayment: boolean = false,
    public readonly timestamp: Date = new Date(),
  ) {}
}

export interface CheckoutItemSummary {
  listingId: number;
  listingTitle: string;
  listingUrl?: string | null;
  shopName: string;
  orderSourceId?: number | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}
