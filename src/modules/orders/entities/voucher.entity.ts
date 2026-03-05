import {
  Collection,
  Entity,
  EntityRepositoryType,
  Enum,
  OneToMany,
  type Opt,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { VouchersRepository } from '../repositories/vouchers.repository';
import { VoucherCondition } from './voucher-condition.entity';
import { VoucherUsageLog } from './voucher-usage-log.entity';
import { Order } from './order.entity';

@Entity({ repository: () => VouchersRepository })
export class Voucher {
  [EntityRepositoryType]?: VouchersRepository;

  @PrimaryKey({ unsigned: false })
  id!: number;

  @Property({ unique: 'voucher_code' })
  voucherCode!: string;

  @Enum({ items: () => voucherTypes })
  voucherType!: voucherTypes;

  @Property({ length: 10 })
  discountUnit!: string;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  discountValue!: string;

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cappedAmount?: string;

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  minOrderAmount?: string;

  @Property({ columnType: 'timestamp' })
  startDate!: Date;

  @Property({ type: 'date' })
  expiryDate!: string;

  @Property({ nullable: true })
  maxGlobalUsage?: number;

  @Property({ type: 'integer' })
  maxPerUserUsage: number & Opt = 1;

  @Property({ type: 'boolean', nullable: true })
  isOneTime?: boolean = false;

  @Property({ type: 'boolean', nullable: true })
  isActive?: boolean = true;

  @Property({ type: 'boolean', nullable: true })
  isDummy?: boolean = false;

  @Property({ type: 'boolean', nullable: true })
  isDeleted?: boolean = false;

  @Property({ type: 'text', length: 65535, nullable: true })
  description?: string;

  @Property({ columnType: 'timestamp', nullable: true, defaultRaw: `CURRENT_TIMESTAMP` })
  createdAt?: Date;

  @Property({
    columnType: 'timestamp',
    nullable: true,
    defaultRaw: `CURRENT_TIMESTAMP`,
    extra: 'on update CURRENT_TIMESTAMP',
  })
  updatedAt?: Date;

  @OneToMany(() => VoucherCondition, condition => condition.voucher)
  conditions = new Collection<VoucherCondition>(this);

  @OneToMany(() => VoucherUsageLog, usageLog => usageLog.voucher)
  usageLogs = new Collection<VoucherUsageLog>(this);

  @OneToMany(() => Order, order => order.voucher)
  orders = new Collection<Order>(this);
}

export enum voucherTypes {
  PRICE_DISCOUNT = 'PRICE_DISCOUNT',
  FREE_SHIPPING = 'FREE_SHIPPING',
}
