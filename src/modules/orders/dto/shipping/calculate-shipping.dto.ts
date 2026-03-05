import { CheckoutItemDto } from '../checkout/checkout-item.dto';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, ValidateNested, IsOptional } from 'class-validator';

export class CalculateShippingDto {
  @ApiProperty({
    type: [CheckoutItemDto],
    description: 'Array of cart items to calculate shipping for',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  cartItems: CheckoutItemDto[];

  @ApiPropertyOptional({
    description: 'Destination city ID for delivery',
    example: 5000,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  destinationCityId?: number;
}
