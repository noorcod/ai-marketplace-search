import { Entity, EntityRepositoryType, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { MarketplaceUser } from './marketplace-user.entity';
import { ReservationsRepository } from '../repositories/reservations.repository';
import { Listing } from '@modules/listings/entities/listing.entity';
import { Shop } from '@modules/stores/entities/shop.entity';
import { Location } from '@modules/stores/entities/location.entity';

@Entity({ repository: () => ReservationsRepository })
export class Reservations {
  [EntityRepositoryType]?: ReservationsRepository;
  @PrimaryKey({ unsigned: false })
  id!: number;

  @Property({ length: 70 })
  customerName!: string;

  @Property({ length: 150, nullable: true })
  customerEmail?: string;

  @Property({ length: 18 })
  customerNumber!: string;

  @Property()
  quantity!: number;

  @ManyToOne({
    entity: () => Shop,
    fieldName: 'shop_id',
    updateRule: 'cascade',
    deleteRule: 'cascade',
    index: 'shop_id',
  })
  shop?: Shop | number;

  @ManyToOne({
    entity: () => Location,
    fieldName: 'location_id',
    updateRule: 'cascade',
    deleteRule: 'cascade',
    index: 'location_id',
  })
  location?: Location | number;

  @Property({ fieldName: 'item_id', nullable: true, index: 'item_id' })
  itemId?: number;

  @ManyToOne({
    entity: () => Listing,
    fieldName: 'listing_id',
    updateRule: 'cascade',
    deleteRule: 'cascade',
    index: 'reservations_ibfk_5_idx',
  })
  listing?: Listing | number;

  @ManyToOne({
    entity: () => MarketplaceUser,
    fieldName: 'fk_customer_id',
    updateRule: 'cascade',
    deleteRule: 'cascade',
    index: 'fk_customer_id',
  })
  customer!: MarketplaceUser | string;

  @Property({ length: 50 })
  status!: string;

  @Property({ length: 1000, nullable: true })
  notes?: string;

  @Property()
  createdAt!: Date;

  @Property({ nullable: true })
  updatedAt?: Date;

  @Property({ nullable: true })
  deletedAt?: Date;
}
