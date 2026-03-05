import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaymentMethod } from '@modules/orders/dto/checkout/checkout.dto';

/**
 * DTO for POST /vouchers/validate endpoint (request body)
 */
export class ValidateVoucherDto {
  @ApiProperty({
    description: 'Voucher code to validate',
    example: 'SAVE20',
  })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiPropertyOptional({
    description: 'User ID for usage validation',
    example: 'user123',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'City ID for location validation',
    example: 1,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  cityId?: number;

  @ApiPropertyOptional({
    description: 'Category IDs for validation',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  categoryIds?: number[];

  @ApiPropertyOptional({
    description: 'Product/listing IDs for validation',
    example: [100, 200, 300],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  productIds?: number[];

  @ApiPropertyOptional({
    description: 'Shop ID',
    example: 5,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  // TODO: Consider changing to shopIds?: number[] to support multi-shop validation
  // Currently validates against single shop only, which may not work correctly for
  // multi-shop carts. Need to align with how categoryIds and productIds work.
  shopId?: number;

  @ApiPropertyOptional({
    description: 'Order amount for discount calculation',
    example: 1000,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  orderAmount?: number;

  @ApiPropertyOptional({
    description: 'Payment method',
    example: 'Cash',
    enum: PaymentMethod,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;
}

/**
 * @deprecated Use ValidateVoucherDto instead (for POST /vouchers/validate)
 * Legacy DTO for query parameter validation - kept for backward compatibility
 */
export class ValidateVoucherQueryDto {
  @ApiPropertyOptional({
    description: 'User ID for usage validation',
    example: 'user123',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'City ID for location validation',
    example: 1,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  cityId?: number;

  @ApiPropertyOptional({
    description: 'Comma-separated category IDs',
    example: '1,2,3',
    type: String,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.split(',').map(Number))
  categoryIds?: string;

  @ApiPropertyOptional({
    description: 'Comma-separated product/listing IDs',
    example: '100,200,300',
    type: String,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.split(',').map(Number))
  productIds?: string;

  @ApiPropertyOptional({
    description: 'Shop ID',
    example: 5,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  shopId?: number;

  @ApiPropertyOptional({
    description: 'Order amount for discount calculation',
    example: 1000,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  orderAmount?: number;

  @ApiPropertyOptional({
    description: 'Payment method',
    example: 'Cash',
    type: String,
  })
  @IsOptional()
  @IsString()
  paymentMethod?: string;
}
