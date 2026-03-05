import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional, ApiQuery } from '@nestjs/swagger';

export enum CartItemsDeleteOps {
  CLEAR_ALL = 'clear-all',
  CLEAR_ITEM = 'clear-item',
  CLEAR_SHOP = 'clear-shop',
}

export class DeleteCartItemQueryDto {
  @ApiPropertyOptional({
    description: 'Select deletion operation: clear-all, clear-item, clear-shop',
    type: String,
  })
  @IsNotEmpty()
  @IsEnum(CartItemsDeleteOps)
  op: CartItemsDeleteOps;

  @ApiPropertyOptional({ description: 'Shop ID', required: false, type: Number })
  @IsOptional()
  @IsString()
  shopId?: number;

  @ApiPropertyOptional({ description: 'Cart Item IDs', type: [Number] })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(Number);
    if (typeof value === 'string') return value.split(',').map(Number);
    return [];
  })
  cartItemIds?: number[];
}
