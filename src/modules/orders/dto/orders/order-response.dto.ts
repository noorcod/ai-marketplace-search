import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderItemResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 12345 })
  listingId: number;

  @ApiProperty({ example: 'Apple MacBook Pro 16" M1 Pro' })
  productTitle: string;

  @ApiProperty({ example: 'https://s3.amazonaws.com/bucket/image.jpg' })
  productPrimaryImage: string;

  @ApiProperty({ example: 'New' })
  condition: string;

  @ApiProperty({ example: 'Laptop' })
  category: string;

  @ApiProperty({ example: '135000.00', description: 'Per-unit effective price (after discount)' })
  price: string;

  @ApiProperty({ example: '5000.00', description: 'Per-unit discount' })
  discount: string;

  @ApiProperty({ example: 1 })
  quantity: number;

  @ApiPropertyOptional({ example: '1 Year Warranty' })
  warranty?: string;

  @ApiPropertyOptional({ example: 'No returns after 7 days' })
  terms?: string;

  @ApiProperty({ example: 'TB-1234567890123-1' })
  orderNumber: string;

  @ApiProperty({ example: '140000.00', description: 'Original price (before discount)' })
  salePrice: string;

  @ApiProperty({ example: '95000.00', description: 'Minimum cost price' })
  minCostPrice: string;

  @ApiProperty({ example: '95000.00', description: 'Maximum cost price' })
  maxCostPrice: string;

  @ApiProperty({ example: '500.00', description: 'Delivery charges for this item (quantity * per-unit charge)' })
  deliveryCharges: string;

  @ApiProperty({ example: '2024-01-09T10:30:00.000Z' })
  createdAt: Date;

  @ApiPropertyOptional({ example: '2024-01-09T10:30:00.000Z' })
  updatedAt?: Date;
}

export class OrderSourceResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1095 })
  shopId: number;

  @ApiPropertyOptional({ example: 5 })
  locationId?: number;

  @ApiProperty({
    example: 'Pending',
    enum: [
      'Pending',
      'Verifying Payment',
      'Payment Failed',
      'Confirmed',
      'Picked',
      'Shipped',
      'Delivered',
      'Cancelled',
    ],
  })
  status: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: '280000.00', description: 'Total amount for this shop' })
  amount: string;

  @ApiProperty({ example: '10000.00', description: 'Total discount for this shop' })
  discountValue: string;

  @ApiPropertyOptional({ example: 1 })
  voucherId?: number;

  @ApiProperty({ example: '0.00', description: 'Voucher discount (not distributed per shop)' })
  voucherDiscount: string;

  @ApiProperty({ example: '1000.00', description: 'Total delivery charges for this shop' })
  deliveryCharges: string;

  @ApiPropertyOptional({ example: 'TCS123456789' })
  trackingId?: string;

  @ApiProperty({ type: [OrderItemResponseDto] })
  orderItems: OrderItemResponseDto[];

  @ApiProperty({ example: '2024-01-09T10:30:00.000Z' })
  createdAt: Date;

  @ApiPropertyOptional({ example: '2024-01-09T10:30:00.000Z' })
  updatedAt?: Date;
}

export class OrderDeliveryAddressResponseDto {
  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiPropertyOptional({ example: 'john.doe@example.com' })
  email?: string;

  @ApiProperty({ example: '+923001234567' })
  contact: string;

  @ApiPropertyOptional({ example: '+923009876543' })
  alternativeNumber?: string;

  @ApiProperty({ example: 'House 123, Street 45, F-10 Markaz' })
  streetAddress: string;

  @ApiProperty({ example: 'Islamabad' })
  city: string;

  @ApiProperty({ example: 'Islamabad Capital Territory' })
  province: string;

  @ApiProperty({ example: 'Pakistan' })
  country: string;

  @ApiPropertyOptional({ example: 'Near Blue Area' })
  nearLandmark?: string;
}

export class OrderPaymentResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '285000.00', description: 'Amount to be received' })
  amountReceivable: string;

  @ApiPropertyOptional({ example: '285000.00', description: 'Amount actually received' })
  amountReceived?: string;

  @ApiProperty({ example: 'Cash', enum: ['Cash', 'Card', 'Bank Transfer', 'BNPL', 'Raast'] })
  trxMethod: string;

  @ApiPropertyOptional({ example: '2024-01-09T10:35:00.000Z' })
  trxTime?: Date;

  @ApiPropertyOptional({ example: 'APG123456789' })
  trxId?: string;

  @ApiPropertyOptional({ example: '285000.00' })
  trxAmount?: string;

  @ApiProperty({
    example: 'PENDING',
    enum: ['PENDING', 'APPROVED', 'SETTLED', 'SETTLED_PENDING', 'DECLINED', 'CREATED', 'EXPIRED'],
  })
  trxStatus: string;

  @ApiPropertyOptional({ example: 'uuid-session-id' })
  trxSessionId?: string;

  @ApiPropertyOptional({ example: 'uuid-trx-id' })
  trxUuid?: string;

  @ApiPropertyOptional({ example: 'proof/screenshot.jpg' })
  trxProof?: string;

  @ApiPropertyOptional({ example: 'Insufficient funds' })
  trxFailureMessage?: string;
}

export class OrderResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'TB-1234567890123-1' })
  orderNumber: string;

  @ApiProperty({ example: 'b52fe17a-35c0-4e9f-837e-2ed7c4bc80e8' })
  userId: string;

  @ApiProperty({
    example: 'Pending',
    enum: [
      'Pending',
      'Verifying Payment',
      'Payment Failed',
      'In Progress',
      'Partially Fulfilled',
      'Completed',
      'Cancelled',
    ],
  })
  status: string;

  @ApiProperty({ example: 2, description: 'Total quantity of items' })
  quantity: number;

  @ApiProperty({ example: '280000.00', description: 'Order amount (sum of effective prices)' })
  orderAmount: string;

  @ApiProperty({ example: '10000.00', description: 'Total product discount' })
  productDiscount: string;

  @ApiProperty({ example: '0.00', description: 'Voucher discount' })
  voucherDiscount: string;

  @ApiProperty({ example: '10000.00', description: 'Total cumulative discount' })
  cummulativeDiscount: string;

  @ApiProperty({ example: '280000.00', description: 'Subtotal after discounts' })
  subTotal: string;

  @ApiProperty({ example: '5000.00', description: 'Delivery charges' })
  deliveryAmount: string;

  @ApiProperty({ example: '285000.00', description: 'Grand total including delivery' })
  grandTotal: string;

  @ApiPropertyOptional({ example: 1 })
  voucherId?: number;

  @ApiProperty({ type: [OrderSourceResponseDto] })
  orderSources: OrderSourceResponseDto[];

  @ApiPropertyOptional({ type: OrderDeliveryAddressResponseDto })
  deliveryAddress?: OrderDeliveryAddressResponseDto;

  @ApiPropertyOptional({ type: OrderPaymentResponseDto })
  payment?: OrderPaymentResponseDto;

  @ApiProperty({ example: '2024-01-09T10:30:00.000Z' })
  createdAt: Date;

  @ApiPropertyOptional({ example: '2024-01-09T10:30:00.000Z' })
  updatedAt?: Date;
}

export class OrderListResponseDto {
  @ApiProperty({ type: [OrderResponseDto] })
  data: OrderResponseDto[];

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  size: number;

  @ApiProperty({ example: 25 })
  total: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}
