import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

/**
 * Minimal DTO for checkout items - only essential fields needed for order creation
 */
export class CheckoutItemDto {
  @ApiProperty({ description: 'Listing ID', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  listingId: number;

  @ApiProperty({ description: 'Shop ID', example: 5 })
  @IsNotEmpty()
  @IsNumber()
  shopId: number;

  @ApiProperty({ description: 'Quantity', example: 2 })
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiProperty({ description: 'Unit price', example: 1500.0 })
  @IsNotEmpty()
  @IsNumber()
  unitPrice: number;

  @ApiPropertyOptional({ description: 'Unit discount', example: 100.0 })
  @IsOptional()
  @IsNumber()
  unitDiscount?: number;

  @ApiPropertyOptional({ description: 'Item ID (optional, for tracking)', example: 1 })
  @IsOptional()
  @IsNumber()
  itemId?: number;
}
