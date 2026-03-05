import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEnum, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { CheckoutItemDto } from './checkout-item.dto';
import { DeliveryAddressDto } from '@modules/carts/dto/delivery-address.dto';

/**
 * Payment methods supported by the checkout
 */
export enum PaymentMethod {
  COD = 'COD',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  RAAST = 'RAAST',
  BNPL = 'BNPL',
}

/**
 * DTO for unified checkout endpoint
 */
export class CheckoutDto {
  @ApiProperty({
    type: [CheckoutItemDto],
    description: 'Array of cart items to checkout (at least one required)',
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Cart cannot be empty' })
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  cartItems: CheckoutItemDto[];

  @ApiProperty({
    type: DeliveryAddressDto,
    description: 'Delivery address details',
  })
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  deliveryAddress: DeliveryAddressDto;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    example: PaymentMethod.COD,
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Delivery charge amount',
    example: 150,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  deliveryChargeAmount?: number;

  @ApiPropertyOptional({
    description: 'Voucher ID to apply',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  voucherId?: number;

  @ApiPropertyOptional({
    description: 'Amount receivable from customer',
    example: 5000,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  amountReceivable?: number;
}
