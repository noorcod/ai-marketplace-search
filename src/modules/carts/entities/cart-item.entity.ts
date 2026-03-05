import { Entity, EntityRepositoryType, ManyToOne, type Opt, PrimaryKey, Property } from '@mikro-orm/core';
import { Cart } from './cart.entity';
import { Items } from '@modules/listings/entities/items.entity';
import { Shop } from '@modules/stores/entities/shop.entity';
import { Listing } from '@modules/listings/entities/listing.entity';
import { CartItemRepository } from '../repositories/cart-item.repository';
import { Location } from '@modules/stores/entities/location.entity';

@Entity({ repository: () => CartItemRepository })
export class CartItem {
  [EntityRepositoryType]?: CartItemRepository;

  @PrimaryKey({ unsigned: false })
  id!: number;

  @ManyToOne({ entity: () => Cart, updateRule: 'cascade', deleteRule: 'cascade', index: 'cart_id' })
  cart!: Cart;

  @ManyToOne({
    entity: () => Listing,
    fieldName: 'listing_id',
    updateRule: 'cascade',
    deleteRule: 'cascade',
    index: 'listing_id',
  })
  listing!: Listing;

  @ManyToOne({
    entity: () => Items,
    fieldName: 'item_id',
    updateRule: 'cascade',
    deleteRule: 'cascade',
    index: 'item_id',
  })
  item!: Items;

  @ManyToOne({
    entity: () => Shop,
    fieldName: 'shop_id',
    updateRule: 'cascade',
    deleteRule: 'cascade',
    index: 'shop_id',
  })
  shop!: Shop;

  @ManyToOne({
    entity: () => Location,
    fieldName: 'location_id',
    updateRule: 'cascade',
    deleteRule: 'cascade',
    index: 'location_id',
  })
  location!: Location;

  @Property()
  quantity!: number;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice!: string;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  unitDiscount!: string;

  @Property({ type: 'boolean' })
  isUpdated: boolean & Opt = false;

  @Property({ type: 'boolean' })
  isNla: boolean & Opt = false;

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  oldPrice?: string;

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  oldDiscount?: string;

  @Property({ type: 'boolean' })
  isDummy: boolean & Opt = false;

  @Property({ columnType: 'timestamp', nullable: true, defaultRaw: `CURRENT_TIMESTAMP` })
  createdAt?: Date;

  @Property({
    columnType: 'timestamp',
    nullable: true,
    defaultRaw: `CURRENT_TIMESTAMP`,
    extra: 'on update CURRENT_TIMESTAMP',
  })
  updatedAt?: Date;
}
