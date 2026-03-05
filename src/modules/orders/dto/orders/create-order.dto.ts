import { CheckoutItemDto } from '../checkout/checkout-item.dto';
import { DeliveryAddressDto } from '@modules/carts/dto/delivery-address.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsDate, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { OrderPaymentDto } from '../payments/order-payment.dto';
import { Type } from 'class-transformer';

export class CreateOrderDto {
  @ApiProperty({
    type: [CheckoutItemDto],
    description: 'Array of cart items (at least one required)',
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Cart cannot be empty' })
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  cartItems: CheckoutItemDto[];

  @ApiPropertyOptional({
    type: DeliveryAddressDto,
    description: 'Delivery address details',
  })
  deliveryAddress: DeliveryAddressDto;

  @ApiPropertyOptional({
    type: OrderPaymentDto,
    description: 'Payment details for the order',
  })
  paymentDetails: OrderPaymentDto;

  // @ApiPropertyOptional({ description: 'Amount received from customer', example: 5000 })
  // @IsOptional()
  // @IsNumber()
  // amountReceived?: number;

  // @ApiPropertyOptional({ description: 'Delivery address ID', example: 1 })
  // @IsOptional()
  // @IsNumber()
  // deliveryAddressId?: number;

  @ApiPropertyOptional({ description: 'Delivery charge amount', example: 1000 })
  @IsOptional()
  @IsNumber()
  deliveryChargeAmount?: number;

  // @ApiPropertyOptional({ description: 'Payment method', example: 'CARD' })
  // @IsOptional()
  // paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Voucher ID', example: 1 })
  @IsOptional()
  @IsNumber()
  voucherId?: number;

  @IsDate()
  @IsOptional()
  created_at?: Date;
}
