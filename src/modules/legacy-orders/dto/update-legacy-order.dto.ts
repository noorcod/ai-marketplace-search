import { dateTime } from '@common/utilities/date-time';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateLegacyOrderDto {
  @IsNotEmpty()
  @IsString()
  orderNumber: string;

  @IsNotEmpty()
  @IsString()
  status: string = 'Verifying Payment';

  @IsNotEmpty()
  @IsEnum(['PENDING', 'APPROVED', 'SETTLED', 'SETTLED_PENDING', 'DECLINED', 'CREATED', 'EXPIRED'])
  trxStatus: 'PENDING' | 'APPROVED' | 'SETTLED' | 'SETTLED_PENDING' | 'DECLINED' | 'CREATED' | 'EXPIRED';

  @IsNotEmpty()
  @IsUUID('4')
  trxSessionId: string;

  @IsNotEmpty()
  @IsUUID('4')
  trxUuid: string;

  @IsOptional()
  @IsNumber()
  trxExpectedSettlementAmount: number;

  // Updated at time as per GTM +5 Time Zone
  @IsOptional()
  updatedAt: Date = dateTime();
}
