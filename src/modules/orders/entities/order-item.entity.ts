import { Entity, EntityRepositoryType, ManyToOne, type Opt, PrimaryKey, Property } from '@mikro-orm/core';
import { OrderSource } from './order-source.entity';
import { Listing } from '@modules/listings/entities/listing.entity';
import { OrderItemRepository } from '../repositories/order-item.repository';

@Entity({ repository: () => OrderItemRepository })
export class OrderItem {
  [EntityRepositoryType]?: OrderItemRepository;
  @PrimaryKey({ unsigned: false })
  id!: number;

  @ManyToOne({
    entity: () => Listing,
    fieldName: 'listing_id',
    updateRule: 'cascade',
    deleteRule: 'cascade',
    index: 'listing_id',
  })
  listing!: Listing;

  @Property({ length: 300 })
  productTitle!: string;

  @Property()
  productPrimaryImage!: string;

  @Property({ length: 50 })
  condition!: string;

  @Property({ length: 50 })
  category!: string;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  price!: string;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  discount!: string;

  @Property()
  quantity!: number;

  @Property({ length: 300, nullable: true })
  warranty?: string;

  @Property({ type: 'text', length: 65535, nullable: true })
  terms?: string;

  @ManyToOne({ entity: () => OrderSource, updateRule: 'cascade', deleteRule: 'cascade', index: 'order_source_id' })
  orderSource!: OrderSource;

  @Property({ length: 18 })
  orderNumber!: string;

  @Property({ length: 50 })
  salePrice!: string;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  minCostPrice!: string;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  maxCostPrice!: string;

  @Property({ type: 'decimal', precision: 10, scale: 2, defaultRaw: `0.00` })
  deliveryCharges!: string & Opt;

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
}
