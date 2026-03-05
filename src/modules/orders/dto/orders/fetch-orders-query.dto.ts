import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '@common/dtos/pagination-query.dto';

export class FetchOrdersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by order status',
    enum: [
      'Pending',
      'Verifying Payment',
      'Payment Failed',
      'In Progress',
      'Partially Fulfilled',
      'Completed',
      'Cancelled',
    ],
    example: 'Pending',
  })
  @IsOptional()
  @IsEnum([
    'Pending',
    'Verifying Payment',
    'Payment Failed',
    'In Progress',
    'Partially Fulfilled',
    'Completed',
    'Cancelled',
  ])
  status?: string;

  @ApiPropertyOptional({
    description: 'Search by order number',
    example: 'TB-1234567890123-1',
  })
  @IsOptional()
  @IsString()
  orderNumber?: string;

  @ApiPropertyOptional({
    description: 'Filter by payment method',
    enum: ['Cash', 'Card', 'Bank Transfer', 'BNPL', 'Raast'],
    example: 'Cash',
  })
  @IsOptional()
  @IsEnum(['Cash', 'Card', 'Bank Transfer', 'BNPL', 'Raast'])
  paymentMethod?: string;
}
