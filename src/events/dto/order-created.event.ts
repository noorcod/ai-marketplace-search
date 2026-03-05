export class OrderCreatedEvent {
  constructor(
    public readonly orderNumber,
    public readonly listingTitle,
    public readonly listingURL,
    public readonly shopName,
    public readonly shopAddress,
    public readonly shopContact,
    public readonly city,
    public readonly qty,
    public readonly price,
    public readonly totalPrice,
    public readonly deliveryCharges,
    public readonly customerName,
    public readonly customerContact,
    public readonly customerAddress,
    public readonly appliedVoucher,
    public readonly voucherDiscount,
    public readonly trxMethod,
    public readonly trxStatus,
    public readonly isPotentialScam = false,
    public readonly trxProof = null,
  ) {}
}
