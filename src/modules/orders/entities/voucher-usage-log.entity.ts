import { Entity, EntityRepositoryType, ManyToOne, type Opt, PrimaryKey, Property } from '@mikro-orm/core';
import { Voucher } from './voucher.entity';
import { VoucherUsageLogRepository } from '../repositories/voucher-usage-log.repository';
import { Order } from './order.entity';
import { MarketplaceUser } from '@modules/users/entities/marketplace-user.entity';

@Entity({ repository: () => VoucherUsageLogRepository })
export class VoucherUsageLog {
  [EntityRepositoryType]?: VoucherUsageLogRepository;

  @PrimaryKey({ unsigned: false })
  id!: number;

  @ManyToOne({
    entity: () => Voucher,
    updateRule: 'cascade',
    deleteRule: 'cascade',
    index: 'voucher_usage_log_voucher_FK',
  })
  voucher!: Voucher;

  @ManyToOne({
    entity: () => Order,
    updateRule: 'cascade',
    deleteRule: 'cascade',
    index: 'voucher_usage_log_order_FK',
  })
  order!: Order;

  @ManyToOne({
    entity: () => MarketplaceUser,
    fieldName: 'user_id',
    updateRule: 'cascade',
    deleteRule: 'cascade',
    index: 'voucher_usage_log_user_FK',
  })
  user!: MarketplaceUser;

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  discountApplied?: string;

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  finalAmount?: string;

  @Property({ type: 'datetime', defaultRaw: `CURRENT_TIMESTAMP` })
  usedAt!: Date & Opt;
}
