import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class UpdateCartItemQuantityDto {
  @ApiPropertyOptional({ description: 'Enter quantity', required: true, example: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;
}
