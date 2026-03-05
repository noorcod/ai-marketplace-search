import { ApiProperty } from '@nestjs/swagger';

/**
 * Validation error types for order creation
 */
export enum ValidationErrorType {
  PRICE_MANIPULATION = 'PRICE_MANIPULATION',
  DISCOUNT_MANIPULATION = 'DISCOUNT_MANIPULATION',
  PLATFORM_FEE_INVALID = 'PLATFORM_FEE_INVALID',
  TOTAL_AMOUNT_INVALID = 'TOTAL_AMOUNT_INVALID',
  LISTING_NOT_FOUND = 'LISTING_NOT_FOUND',
  PRICE_CHANGED = 'PRICE_CHANGED',
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  INVALID_LISTING = 'INVALID_LISTING',
}

/**
 * Detailed validation error for a specific issue
 */
export class ValidationErrorDetail {
  @ApiProperty({
    description: 'Type of validation error',
    enum: ValidationErrorType,
    example: ValidationErrorType.PRICE_MANIPULATION,
  })
  type: ValidationErrorType;

  @ApiProperty({
    description: 'Human-readable error message',
    example: 'Invalid price for MacBook Pro. Expected: ₨50000.00',
  })
  message: string;

  @ApiProperty({
    description: 'Field or item that caused the error',
    example: 'cartItems[0].unitPrice',
    required: false,
  })
  field?: string;

  @ApiProperty({
    description: 'Listing ID related to the error',
    example: 12345,
    required: false,
  })
  listingId?: number;

  @ApiProperty({
    description: 'Expected value',
    example: 50000,
    required: false,
  })
  expected?: any;

  @ApiProperty({
    description: 'Received value',
    example: 1,
    required: false,
  })
  received?: any;

  @ApiProperty({
    description: 'Additional context or details',
    required: false,
  })
  details?: Record<string, any>;
}

/**
 * Response DTO for validation errors
 * Provides structured error information for frontend handling
 */
export class ValidationErrorResponseDto {
  @ApiProperty({
    description: 'Indicates the request failed validation',
    example: false,
  })
  success: boolean;

  @ApiProperty({
    description: 'Primary error message',
    example: 'Order validation failed',
  })
  message: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'List of validation errors',
    type: [ValidationErrorDetail],
  })
  errors: ValidationErrorDetail[];

  @ApiProperty({
    description: 'Timestamp of the error',
    example: '2026-01-29T14:32:00.000Z',
  })
  timestamp: string;
}

/**
 * Price validation error details
 */
export class PriceValidationError extends ValidationErrorDetail {
  @ApiProperty({
    description: 'Product name',
    example: 'MacBook Pro 16" M3',
  })
  productName?: string;

  @ApiProperty({
    description: 'Database price',
    example: 50000,
  })
  databasePrice?: number;

  @ApiProperty({
    description: 'Frontend price',
    example: 1,
  })
  frontendPrice?: number;
}

/**
 * Platform fee validation error details
 */
export class PlatformFeeValidationError extends ValidationErrorDetail {
  @ApiProperty({
    description: 'Payment method',
    example: 'Card',
  })
  paymentMethod?: string;

  @ApiProperty({
    description: 'Expected platform fee',
    example: 3484,
  })
  expectedFee?: number;

  @ApiProperty({
    description: 'Received platform fee',
    example: 0,
  })
  receivedFee?: number;

  @ApiProperty({
    description: 'Platform fee percentage',
    example: 6.48,
  })
  feePercent?: number;
}

/**
 * Total amount validation error details
 */
export class TotalAmountValidationError extends ValidationErrorDetail {
  @ApiProperty({
    description: 'Payment method',
    example: 'Card',
  })
  paymentMethod?: string;

  @ApiProperty({
    description: 'Expected total',
    example: 53684,
  })
  expectedTotal?: number;

  @ApiProperty({
    description: 'Received total',
    example: 40000,
  })
  receivedTotal?: number;

  @ApiProperty({
    description: 'Breakdown of expected total',
  })
  breakdown?: {
    subtotal: number;
    delivery: number;
    voucher: number;
    platformFee: number;
  };
}
