// Enum for APG Transaction Types
import { ApiProperty } from '@nestjs/swagger';
import { CreateOrderDto } from '../orders/create-order.dto';

export enum APG_TRANSACTION_TYPE {
  CARD = 3,
  BNPL = 5,
  RAAST = 12,
}

export class InitApgDto extends CreateOrderDto {
  @ApiProperty({
    description: 'Transaction Type Id',
    enum: APG_TRANSACTION_TYPE,
    default: APG_TRANSACTION_TYPE.CARD,
  })
  transactionTypeId: APG_TRANSACTION_TYPE = APG_TRANSACTION_TYPE.CARD;
}
