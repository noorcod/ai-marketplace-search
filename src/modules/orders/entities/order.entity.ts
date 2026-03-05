import {
  Collection,
  Entity,
  EntityRepositoryType,
  Enum,
  ManyToOne,
  OneToMany,
  OneToOne,
  type Opt,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { Voucher } from './voucher.entity';
import { MarketplaceUser } from '@modules/users/entities/marketplace-user.entity';
import { OrderSource } from './order-source.entity';
import { OrderDeliveryAddress } from './order-delivery-address.entity';
import { OrderRepository } from '../repositories/order.repository';
import { OrderPayment } from './order-payment.entity';
import { VoucherUsageLog } from './voucher-usage-log.entity';
import { OrderStatus } from '../constants/order-status.enum';
import { ListingReview } from '@modules/listings/entities/listing-review.entity';

@Entity({ repository: () => OrderRepository })
export class Order {
  [EntityRepositoryType]?: OrderRepository;
  @PrimaryKey({ unsigned: false })
  id!: number;

  @Property({ length: 18, unique: true, index: true })
  orderNumber!: string;

  @ManyToOne({
    entity: () => MarketplaceUser,
    fieldName: 'user_id',
    updateRule: 'no action',
    deleteRule: 'cascade',
    nullable: true,
    index: 'user_id',
  })
  user?: MarketplaceUser | string;

  @ManyToOne({
    entity: () => Voucher,
    updateRule: 'cascade',
    deleteRule: 'cascade',
    nullable: true,
    index: 'voucher_id',
  })
  voucher?: Voucher;

  @Property({ type: 'boolean' })
  isGuest: boolean & Opt = false;

  @Property({ length: 36, nullable: true })
  guestId?: string;

  @Property({ type: 'text', length: 65535, nullable: true })
  terms?: string;

  @Property({ type: 'text', length: 65535, nullable: true })
  reason?: string;

  @Property({ type: 'boolean' })
  isVoucherApplied: boolean & Opt = false;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  orderAmount!: string;

  @Property()
  quantity!: number;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  deliveryAmount!: string;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  productDiscount!: string;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  voucherDiscount!: string;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  cummulativeDiscount!: string;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  subTotal!: string;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  grandTotal!: string;

  @Property({ type: 'enum', length: 13 })
  managedBy: string & Opt = 'By Techbazaar';

  @Property({ nullable: true })
  eta?: Date;

  @Enum({ items: () => OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus & Opt = OrderStatus.PENDING;

  @Property({ type: 'datetime', defaultRaw: `CURRENT_TIMESTAMP` })
  createdAt!: Date & Opt;

  @Property({ nullable: true })
  updatedAt?: Date;

  @Property({ type: 'tinyint' })
  isDeleted: number & Opt = 0;

  @Property({ nullable: true })
  deletedAt?: Date;

  @Property({ type: 'boolean' })
  isSpam: boolean & Opt = false;

  @Property({ type: 'boolean' })
  isDummy: boolean & Opt = false;

  // Relationships
  @OneToMany(() => OrderSource, orderSource => orderSource.order)
  orderSources = new Collection<OrderSource>(this);

  @OneToOne(() => OrderPayment, orderPayment => orderPayment.order)
  orderPayment!: OrderPayment;

  @OneToMany(() => OrderDeliveryAddress, orderDeliveryAddress => orderDeliveryAddress.order)
  deliveryAddresses = new Collection<OrderDeliveryAddress>(this);

  @OneToMany(() => VoucherUsageLog, voucherUsageLog => voucherUsageLog.order)
  voucherUsageLogs = new Collection<VoucherUsageLog>(this);

  @OneToMany(() => ListingReview, listingReview => listingReview.order)
  reviews = new Collection<ListingReview>(this);
}
