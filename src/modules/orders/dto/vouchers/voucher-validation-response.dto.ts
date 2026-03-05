import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Simplified voucher validation response DTO
 */
export class VoucherValidationResponseDto {
  @ApiProperty({
    description: 'Voucher ID',
    example: 11,
  })
  id: number;

  @ApiProperty({
    description: 'Voucher code',
    example: 'SAVE20',
  })
  code: string;

  @ApiProperty({
    description: 'Whether the voucher is valid and can be applied',
    example: true,
  })
  isValid: boolean;

  @ApiPropertyOptional({
    description: 'Voucher type',
    example: 'PRICE_DISCOUNT',
    enum: ['PRICE_DISCOUNT', 'FREE_SHIPPING'],
  })
  type?: string;

  @ApiPropertyOptional({
    description: 'Discount amount calculated for the order (if applicable)',
    example: 500,
  })
  discountAmount?: number;

  @ApiPropertyOptional({
    description: 'Original order amount before discount',
    example: 5000,
  })
  orderAmount?: number;

  @ApiPropertyOptional({
    description: 'Final order amount after discount',
    example: 4500,
  })
  finalAmount?: number;

  @ApiPropertyOptional({
    description: 'Whether free shipping is applied',
    example: false,
  })
  freeShipping?: boolean;

  @ApiPropertyOptional({
    description: 'Minimum order amount required',
    example: 1000,
  })
  minOrderAmount?: number;

  @ApiPropertyOptional({
    description: 'Maximum discount cap',
    example: 500,
  })
  cappedAmount?: number;

  @ApiPropertyOptional({
    description: 'Voucher expiry date',
    example: '2026-12-31T23:59:59.000Z',
  })
  expiryDate?: Date;

  @ApiPropertyOptional({
    description: 'Error message if validation failed',
    example: 'Voucher has expired',
  })
  message?: string;

  @ApiPropertyOptional({
    description: 'Detailed validation errors (if any)',
    example: ['City does not match', 'Minimum order amount not met'],
    type: [String],
  })
  errors?: string[];
}
