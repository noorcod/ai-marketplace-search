import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class AddCartItemDto {
  @ApiPropertyOptional({ description: 'Enter listing ID', required: true, example: 1 })
  @IsNotEmpty()
  @IsNumber()
  listingId: number;

  @ApiPropertyOptional({ description: 'Enter quantity', required: true, example: 1 })
  @IsNotEmpty()
  @IsNumber()
  quantity: number;
}
