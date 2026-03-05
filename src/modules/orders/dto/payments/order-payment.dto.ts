import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString, IsInt, IsEnum, IsNotEmpty } from 'class-validator';

export enum TrxStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  SETTLED = 'SETTLED',
  SETTLED_PENDING = 'SETTLED_PENDING',
  DECLINED = 'DECLINED',
  CREATED = 'CREATED',
  EXPIRED = 'EXPIRED',
}

export enum TrxMethod {
  Cash = 'Cash',
  Card = 'Card',
  BankTransfer = 'Bank Transfer',
  Card_BNPL = 'Card - BNPL',
  Raast = 'Raast',
}

export class OrderPaymentDto {
  //   @ApiProperty({ description: 'Order ID', example: 1 })
  //   @IsNumber()
  //   @Type(() => Number)
  //   orderId!: number;

  @ApiProperty({ description: 'Amount receivable (decimal)', example: '1000.00' })
  @IsNumber()
  @Type(() => Number)
  amountReceivable!: number;

  @ApiPropertyOptional({ description: 'Amount received (decimal)', example: '0.00' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  amountReceived?: number;

  @ApiPropertyOptional({ description: 'Transaction method', example: TrxMethod.Cash, enum: TrxMethod })
  @IsOptional()
  @IsNotEmpty()
  @IsEnum(TrxMethod)
  trxMethod?: TrxMethod;

  @ApiPropertyOptional({ description: 'Transaction time (ISO string)' })
  @IsOptional()
  @IsDateString()
  trxTime?: string;

  @ApiPropertyOptional({ description: 'Transaction ID', example: 'TXN12345' })
  @IsOptional()
  @IsString()
  trxTypeId?: string;

  @ApiPropertyOptional({ description: 'Transaction amount (decimal)', example: '1000.00' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  trxAmount?: number;

  @ApiPropertyOptional({ description: 'Platform charges (decimal)', example: '10.00' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  platformCharges?: number;

  @ApiPropertyOptional({ description: 'Transaction proof (url or base64)' })
  @IsOptional()
  @IsString()
  trxProof?: string;

  @IsOptional()
  @IsEnum(TrxStatus)
  @ApiPropertyOptional({ description: 'Transaction status', enum: TrxStatus, example: TrxStatus.PENDING })
  trxStatus?: TrxStatus = TrxStatus.PENDING;
}
