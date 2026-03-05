import { Entity, EntityRepositoryType, ManyToOne, OneToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { Listing } from '@modules/listings/entities/listing.entity';
import { MarketplaceUser } from '@modules/users/entities/marketplace-user.entity';
import { ListingReviewsRepository } from '../repositories/listing-reviews.repository';
import { LegacyOrder } from '@modules/legacy-orders/entities/legacy-order.entity';
import { Order } from '@modules/orders/entities/order.entity';
import { OrderSource } from '@modules/orders/entities/order-source.entity';
import { Shop } from '@modules/stores/entities/shop.entity';

@Entity({ repository: () => ListingReviewsRepository })
export class ListingReview {
  [EntityRepositoryType]?: ListingReviewsRepository;

  @PrimaryKey({ unsigned: false })
  id!: number;

  @ManyToOne(() => Listing, {
    fieldName: 'fk_listing_id',
    index: 'fk_listing_review_listing',
  })
  listing!: Listing | number;

  // Legacy order support (one-to-one relationship)
  @OneToOne(() => LegacyOrder, {
    fieldName: 'fk_legacy_order_id',
    index: 'fk_listing_review_legacy_order',
    nullable: true,
  })
  legacyOrder?: LegacyOrder | number;

  // New order system (many-to-one relationship - multiple reviews per order)
  @ManyToOne(() => Order, {
    fieldName: 'fk_order_id',
    index: 'fk_listing_review_order',
    nullable: true,
  })
  order?: Order | number;

  @ManyToOne(() => OrderSource, {
    fieldName: 'fk_order_source_id',
    index: 'fk_listing_review_order_source',
    nullable: true,
  })
  orderSource?: OrderSource | number;

  @ManyToOne(() => Shop, {
    fieldName: 'fk_shop_id',
    index: 'fk_listing_review_shop',
    nullable: true,
  })
  shop?: Shop | number;

  @ManyToOne(() => MarketplaceUser, {
    fieldName: 'fk_user_id',
    type: 'character',
    length: 36,
    index: 'fk_listing_review_user',
    nullable: true,
  })
  user?: MarketplaceUser | string;

  @Property({ nullable: true })
  rating?: number;

  @Property({ type: 'text', length: 65535, nullable: true })
  review?: string;

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

  @Property({ type: 'boolean', nullable: true })
  isPending?: boolean = true;
}
