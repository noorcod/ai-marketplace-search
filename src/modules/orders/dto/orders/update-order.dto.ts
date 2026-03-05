import { dateTime } from '@common/utilities/date-time';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrderDto {
  @ApiProperty({
    description: 'Order number to update',
    example: 'TB-1234567890123-1',
  })
  @IsNotEmpty()
  @IsString()
  orderNumber: string;

  @ApiProperty({
    description: 'Order status',
    example: 'Verifying Payment',
    enum: [
      'Pending',
      'Verifying Payment',
      'Payment Failed',
      'In Progress',
      'Partially Fulfilled',
      'Completed',
      'Cancelled',
    ],
  })
  @IsNotEmpty()
  @IsString()
  status: string = 'Verifying Payment';

  @ApiProperty({
    description: 'Transaction status from payment gateway',
    example: 'APPROVED',
    enum: ['PENDING', 'APPROVED', 'SETTLED', 'SETTLED_PENDING', 'DECLINED', 'CREATED', 'EXPIRED'],
  })
  @IsNotEmpty()
  @IsEnum(['PENDING', 'APPROVED', 'SETTLED', 'SETTLED_PENDING', 'DECLINED', 'CREATED', 'EXPIRED'])
  trxStatus: 'PENDING' | 'APPROVED' | 'SETTLED' | 'SETTLED_PENDING' | 'DECLINED' | 'CREATED' | 'EXPIRED';

  @ApiPropertyOptional({
    description: 'Transaction session ID from payment gateway',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsOptional()
  @IsUUID('4')
  trxSessionId?: string;

  @ApiPropertyOptional({
    description: 'Transaction UUID from payment gateway',
    example: 'f9e8d7c6-b5a4-3210-fedc-ba0987654321',
  })
  @IsOptional()
  @IsUUID('4')
  trxUuid?: string;

  @ApiPropertyOptional({
    description: 'Expected settlement amount from payment gateway',
    example: 285000,
  })
  @IsOptional()
  @IsNumber()
  trxExpectedSettlementAmount: number;

  @ApiPropertyOptional({
    description: 'Updated timestamp (GTM +5 Time Zone)',
    example: '2024-01-09T10:30:00.000Z',
  })
  @IsOptional()
  updatedAt: Date = dateTime();
}
