import { Entity, EntityRepositoryType, PrimaryKey, Property } from '@mikro-orm/core';
import { LegacyVoucherRepository } from '../repositories/legacy-voucher.repository';

@Entity({ repository: () => LegacyVoucherRepository, tableName: 'd4u_voucher' })
export class LegacyVoucher {
  [EntityRepositoryType] = LegacyVoucherRepository;

  @PrimaryKey({ unsigned: false })
  id!: number;

  @Property({ unique: 'voucher_code' })
  voucherCode!: string;

  @Property({ length: 10 })
  discountUnit!: string;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  discountValue!: string;

  @Property({ type: 'text', length: 65535, nullable: true })
  description?: string;

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cappedAmount?: string;

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  minOrderAmount?: string;

  @Property({ type: 'date' })
  expiryDate!: string;

  @Property({ columnType: 'timestamp', nullable: true, defaultRaw: `CURRENT_TIMESTAMP` })
  createdAt?: Date;

  @Property({
    columnType: 'timestamp',
    nullable: true,
    defaultRaw: `CURRENT_TIMESTAMP`,
    extra: 'on update CURRENT_TIMESTAMP',
  })
  updatedAt?: Date;

  @Property({ type: 'boolean', nullable: true })
  isDeleted?: boolean = false;
}
