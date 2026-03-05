import {
  LegacyOrderTrxMethod,
  LegacyOrderTrxStatus,
  LegacyOrderTrxRefundStatus,
  DiscountUnit,
} from '../types/legacy-order.types';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateLegacyOrderDto {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  customerEmail: string;

  @IsNotEmpty()
  @IsString()
  customerName: string;

  @IsPhoneNumber('PK')
  @IsNotEmpty()
  @IsString()
  @Length(15, 15)
  customerPhone: string;

  @IsString()
  @IsNotEmpty()
  customerAddress: string;

  @IsNotEmpty()
  @IsEnum(LegacyOrderTrxMethod)
  trxMethod: LegacyOrderTrxMethod;

  @IsOptional()
  @IsString()
  trxProof?: string;

  @IsOptional()
  @IsEnum(LegacyOrderTrxStatus)
  trxStatus: LegacyOrderTrxStatus = LegacyOrderTrxStatus.PENDING;

  @IsOptional()
  @IsEnum(LegacyOrderTrxRefundStatus)
  trxRefundStatus: LegacyOrderTrxRefundStatus = LegacyOrderTrxRefundStatus.NA;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsNotEmpty()
  @IsNumber()
  originalPrice: number;

  // Discount Unit can be either 'fixed' or 'percentage'
  @IsNotEmpty()
  @IsEnum(DiscountUnit)
  discountUnit: DiscountUnit;

  @IsNotEmpty()
  @IsNumber()
  discountValue: number;

  @IsNotEmpty()
  @IsNumber()
  @ValidateIf((object, value) => value !== null)
  @Transform(({ value }) => (value === null || value === undefined ? 0 : value))
  voucherDiscount: number;

  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsNotEmpty()
  @IsNumber()
  totalPrice: number;

  @IsOptional()
  @IsString()
  notes: string;

  @IsNotEmpty()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  deliveryCharges: number;

  @IsNotEmpty()
  @IsNumber()
  shopId: number;

  @IsNotEmpty()
  @IsNumber()
  itemId: number;

  @IsNotEmpty()
  @IsNumber()
  locationId: number;

  @IsNotEmpty()
  @IsNumber()
  listingId: number;

  @ValidateIf(o => o.userType !== 'guest')
  @IsNotEmpty()
  @IsString()
  customerId: string;

  @IsOptional()
  @IsDate()
  createdAt: Date;

  @IsOptional()
  @IsString()
  userType: string;

  @IsOptional()
  @IsString()
  token: string;

  @IsOptional()
  @IsNumber()
  @ValidateIf((object, value) => value !== null)
  voucher: number | null;
}
