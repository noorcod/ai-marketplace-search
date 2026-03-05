import {
  Collection,
  Entity,
  EntityRepositoryType,
  Enum,
  ManyToOne,
  OneToMany,
  type Opt,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { Voucher } from './voucher.entity';
import { Order } from './order.entity';
import { Shop } from '@modules/stores/entities/shop.entity';
import { OrderItem } from './order-item.entity';
import { OrderSourceRepository } from '../repositories/order-source.repository';
import { Location } from '@modules/stores/entities/location.entity';
import { ListingReview } from '@modules/listings/entities/listing-review.entity';
import { OrderSourceStatus } from '../constants/order-status.enum';

@Entity({ repository: () => OrderSourceRepository })
export class OrderSource {
  [EntityRepositoryType]?: OrderSourceRepository;
  @PrimaryKey({ unsigned: false })
  id!: number;

  @ManyToOne({ entity: () => Order, updateRule: 'cascade', deleteRule: 'cascade', index: 'order_id' })
  order!: Order;

  @ManyToOne({
    entity: () => Shop,
    fieldName: 'shop_id',
    updateRule: 'cascade',
    deleteRule: 'cascade',
    index: 'shop_id',
  })
  shop!: Shop | number;

  @ManyToOne({
    entity: () => Location,
    fieldName: 'location_id',
    updateRule: 'cascade',
    deleteRule: 'cascade',
    index: 'location_id',
  })
  location!: Location | number;

  @Enum({ items: () => OrderSourceStatus, default: OrderSourceStatus.PENDING })
  status: OrderSourceStatus & Opt = OrderSourceStatus.PENDING;

  @Property()
  quantity!: number;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  amount!: string;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  discountValue!: string;

  @ManyToOne({ entity: () => Voucher, nullable: true, index: 'voucher_id' })
  voucher?: Voucher;

  @Property({ type: 'decimal', precision: 10, scale: 2, defaultRaw: `0.00` })
  voucherDiscount!: string & Opt;

  @Property({ type: 'decimal', precision: 10, scale: 2, defaultRaw: `0.00` })
  deliveryCharges!: string & Opt;

  @Property({ length: 45, nullable: true })
  trackingId?: string;

  @Property({ type: 'tinyint' })
  isDeleted: number & Opt = 0;

  @Property({ nullable: true })
  deletedAt?: Date;

  @Property({ type: 'datetime', defaultRaw: `CURRENT_TIMESTAMP` })
  createdAt!: Date & Opt;

  @Property({
    columnType: 'timestamp',
    nullable: true,
    defaultRaw: `CURRENT_TIMESTAMP`,
    extra: 'on update CURRENT_TIMESTAMP',
  })
  updatedAt?: Date;

  // Relationships
  @OneToMany(() => OrderItem, orderItem => orderItem.orderSource)
  orderItems = new Collection<OrderItem>(this);

  @OneToMany(() => ListingReview, listingReview => listingReview.orderSource)
  reviews = new Collection<ListingReview>(this);
}
